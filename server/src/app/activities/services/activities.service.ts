import { Injectable } from '@nestjs/common';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivityResponse } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

@Injectable()
export class ActivitiesService {
  constructor(private readonly helper: ActivitiesFetcherHelper) {}

  async getActivityData(
    userId: string,
    date: string,
  ): Promise<ActivityResponse> {
    const summariesData = await this.helper.getSessionActivityByUserId(
      userId,
      date,
    );
    const summaryTime = await this.helper.getSummaryTime(userId, date);

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports = await this.helper.getRawActivityRawIds(allRawIds);

    const data = this.helper.mapToActivityData(allReports, summariesData);

    return {
      activities: data,
      dailySummaryTime: summaryTime.dailySummaryTime,
      weeklySummaryTime: summaryTime.weeklySummaryTime,
    };
  }

  async getDailyActivity(userId: string, date: string) {
    return await this.helper.getDailyActivity(userId, date);
  }

  async getDailyActivityPerCategory(userId: string, date: string) {
    return await this.helper.getDailyActivityPerCategory(userId, date);
  }
}
