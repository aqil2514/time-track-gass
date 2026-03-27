import { Injectable } from '@nestjs/common';
import { SupervisorActivityFetcher } from './helpers/supervisor-activity-fetcher.service';
import { SupervisorActivityMapper } from './helpers/supervisor-activity-mapper.service';
import { SupervisorMatrixService } from './helpers/supervisor-matrix.service';

@Injectable()
export class SupervisorTrackerService {
  constructor(
    private readonly activityFetchHelper: SupervisorActivityFetcher,
    private readonly activityMapperHelper: SupervisorActivityMapper,
    private readonly matrixHelper: SupervisorMatrixService,
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

    const mappedData =
      await this.activityMapperHelper.mapPopulatedDataKeyToImageUrl(
        activityData,
      );

    return mappedData;
  }

  async getTrackerMatrix(date: string) {
    const users = await this.matrixHelper.getActiveUsers();
    const userIds = users.map((user) => user.id);

    const rawData = await this.matrixHelper.getOneDayActivity(userIds, date);

    const mappedUser = this.matrixHelper.mapToMatrixData(rawData, users);

    return mappedUser;
  }
}
