import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesSessionSummaryCronHelper } from './helpers/activites-cron-session-summary-helper.service';
import { ActivitiesDailySummaryCronHelper } from './helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(
    private readonly sessionSummaryHelper: ActivitiesSessionSummaryCronHelper,
    private readonly dailySummaryHelper: ActivitiesDailySummaryCronHelper,
    private readonly helper: ActivitiesFetcherHelper,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, { disabled: true })
  async createNewSummary() {
    const now = new Date();

    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const oneHourBefore = new Date(hourStart.getTime() - 60 * 60 * 1000);
    const nextHourStart = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const allUser = await this.sessionSummaryHelper.getAllUser();

    const oneHourActivites =
      await this.sessionSummaryHelper.getDuringOneHourActivities(
        oneHourBefore,
        nextHourStart,
        allUser,
      );

    if (oneHourActivites.length === 0) return;

    const mappedData =
      await this.sessionSummaryHelper.mapToSessionSummaryDbInsert(
        oneHourActivites,
      );

    await this.sessionSummaryHelper.createNewSessionSummary(mappedData);
    this.logger.log(
      `Session summary generated for ${mappedData.length} entries from ${oneHourBefore.toISOString()} to ${nextHourStart.toISOString()}`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Jakarta',
  })
  // @Cron(CronExpression.EVERY_10_SECONDS)
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
}
