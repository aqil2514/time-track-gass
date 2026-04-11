import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesSessionSummaryCronHelper } from './helpers/activites-cron-session-summary-helper.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(
    @InjectQueue('daily-summary-queue')
    private readonly dailySummaryQueue: Queue,
    @InjectQueue('daily-category-summary-queue')
    private readonly dailySummaryCategoryQueue: Queue,
    private readonly sessionSummaryHelper: ActivitiesSessionSummaryCronHelper,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    disabled: process.env.NODE_ENV === 'development',
  })
  async createNewSummary() {
    if (process.env.NODE_ENV === 'development') return;

    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const oneHourBefore = new Date(hourStart.getTime() - 60 * 60 * 1000);
    const nextHourStart = new Date(hourStart.getTime() + 60 * 60 * 1000);

    await this.generateSessionSummary(oneHourBefore, nextHourStart);
  }

  async generateSessionSummary(from: Date, to: Date) {
    try {
      const allUser = await this.sessionSummaryHelper.getAllUser();

      const oneHourActivites =
        await this.sessionSummaryHelper.getDuringOneHourActivities(
          from,
          to,
          allUser,
        );

      if (oneHourActivites.length === 0) {
        this.logger.log(
          `No activities found from ${from.toISOString()} to ${to.toISOString()}`,
        );
        return;
      }

      const mappedData =
        await this.sessionSummaryHelper.mapToSessionSummaryDbInsert(
          oneHourActivites,
        );

      await this.sessionSummaryHelper.createNewSessionSummary(mappedData);
      this.logger.log(
        `Session summary generated for ${mappedData.length} entries from ${from.toISOString()} to ${to.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate session summary: ${error}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummary() {
    const allUser = await this.sessionSummaryHelper.getAllUser();

    for (const user of allUser) {
      await this.dailySummaryQueue.add(
        'daily-summary',
        { userId: user },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummaryPerCategory() {
    this.logger.log('Memanggil fungsi buat summary daily per kategori');

    const allUser = await this.sessionSummaryHelper.getAllUser();

    for (const user of allUser) {
      await this.dailySummaryCategoryQueue.add(
        'daily-category-summary',
        {
          userId: user,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }
}
