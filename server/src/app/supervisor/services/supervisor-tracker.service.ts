import { Injectable } from '@nestjs/common';
import { SupervisorActivityFetcher } from './helpers/supervisor-activity-fetcher.service';
import { SupervisorActivityMapper } from './helpers/supervisor-activity-mapper.service';

@Injectable()
export class SupervisorTrackerService {
  constructor(
    private readonly activityFetchHelper: SupervisorActivityFetcher,
    private readonly activityMapperHelper:SupervisorActivityMapper
  ) {}

  async getTrackerActivityData(username: string, date: string) {
    const activityData =
      await this.activityFetchHelper.getActivityDataByUsernameAndDate(
        username,
        date,
      );

    return activityData;
  }

  async getTrackerByActivityId(activityId: string) {
    const activityData =
      await this.activityFetchHelper.getActivityByActivityId(activityId);

    const mappedData = await this.activityMapperHelper.mapPopulatedDataKeyToImageUrl(activityData)

    return mappedData;
  }
}
