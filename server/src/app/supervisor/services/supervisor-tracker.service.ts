import { Injectable } from '@nestjs/common';
import { SupervisorActivityFetcher } from './helpers/supervisor-activity-fetcher.service';

@Injectable()
export class SupervisorTrackerService {
  constructor(
    private readonly activityFetchHelper: SupervisorActivityFetcher,
  ) {}

  async getTrackerActivityData(username:string, date:string){
    const activityData = await this.activityFetchHelper.getActivityDataByUsernameAndDate(username, date)

    return activityData
  }
}
