import { Injectable } from '@nestjs/common';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivityData } from '../interface/activities_data.interface';
import { ActivitiesSummaryTimeService } from './helpers/activities-summary-time.service';
import { ActivitiesWorkSession } from './helpers/activities-work-session.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly helper: ActivitiesFetcherHelper,
    private readonly summaryTimeHelper: ActivitiesSummaryTimeService,
    private readonly workSessionHelper: ActivitiesWorkSession,
  ) {}

  async getActivityData(userId: string, date: string): Promise<ActivityData[]> {
    const summariesData = await this.helper.getSessionActivityByUserId(
      userId,
      date,
    );

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports = await this.helper.getRawActivityRawIds(allRawIds);

    const data = this.helper.mapToActivityData(allReports, summariesData);

    return data;
  }

  async getTotalWork(userId: string, date: string) {
    const { dailySummaryTime, weeklySummaryTime, activityAdjustment } =
      await this.summaryTimeHelper.getSummaryTime(userId, date);

    return { dailySummaryTime, weeklySummaryTime, activityAdjustment };
  }

  async getDailyActivity(userId: string, date: string) {
    return await this.helper.getDailyActivity(userId, date);
  }

  async getWorkSession(userId: string, date: string) {
    const [reports, sessions] = await Promise.all([
      this.workSessionHelper.getWorkReport(userId, date),
      this.workSessionHelper.getWorkSession(userId, date),
    ]);

    const mappedSessions = this.workSessionHelper.mapToWorkSessionReport(
      sessions,
      reports,
    );

    return mappedSessions;
  }

  async getDailyActivityPerCategory(userId: string, date: string) {
    return await this.helper.getDailyActivityPerCategory(userId, date);
  }
}
