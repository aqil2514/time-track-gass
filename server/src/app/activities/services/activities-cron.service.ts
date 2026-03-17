import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesSessionSummaryCronHelper } from './helpers/activites-cron-session-summary-helper.service';
import { ActivitiesDailySummaryCronHelper } from './helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivitiesDailySummaryPerCategoryCronHelper } from './helpers/activities-cron-daily-summary-per-category.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(
    private readonly sessionSummaryHelper: ActivitiesSessionSummaryCronHelper,
    private readonly dailySummaryHelper: ActivitiesDailySummaryCronHelper,
    private readonly dailySummaryPerCategoryHelper: ActivitiesDailySummaryPerCategoryCronHelper,
    private readonly helper: ActivitiesFetcherHelper,
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
      this.logger.error(`Failed to generate session summary: ${error.message}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummary() {
    const allUser = await this.sessionSummaryHelper.getAllUser();

    const summariesData =
      await this.dailySummaryHelper.getSessionActivityByUserId(allUser);

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports = await this.helper.getRawActivityRawIds(allRawIds);

    const data = this.helper.mapToActivityData(allReports, summariesData);

    const mappedData =
      await this.dailySummaryHelper.mapToDailySummaryDbInsert(data);

    await this.dailySummaryHelper.createNewDailySummary(mappedData);

    this.logger.log(`Daily summary generated for ${mappedData.length} entries`);
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async createDailySummaryPerCategory() {
  //   const [allUser, allCategories] = await Promise.all([
  //     this.sessionSummaryHelper.getAllUser(),
  //     this.dailySummaryPerCategoryHelper.getAllCategories(),
  //   ]);
  //   const availableUserActivity:AIScreenReportDb[]= []

  //   for (const user of allUser) {
  //     const userActivity =
  //       await this.dailySummaryPerCategoryHelper.getUserDailyActivity(user);

  //     if (userActivity.length === 0 || !userActivity) continue;

  //     availableUserActivity.push(userActivity)
  //   }
  // }
}
