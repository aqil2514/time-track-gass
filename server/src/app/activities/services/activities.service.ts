import { Injectable } from '@nestjs/common';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivityData } from '../interface/activities_data.interface';

@Injectable()
export class ActivitiesService {
  constructor(private readonly helper: ActivitiesFetcherHelper) {}

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
      await this.helper.getSummaryTime(userId, date);

    return { dailySummaryTime, weeklySummaryTime, activityAdjustment };
  }

  async getDailyActivity(userId: string, date: string) {
    return await this.helper.getDailyActivity(userId, date);
  }

  async getDailyActivityPerCategory(userId: string, date: string) {
    return await this.helper.getDailyActivityPerCategory(userId, date);
  }
}
