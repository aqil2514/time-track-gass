import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ProfileIdAndUsername } from '../../auth/interfaces/profiles.interface';
import { SupervisorActivityFetcher } from './helpers/supervisor-activity-fetcher.service';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';

@Injectable()
export class SupervisorService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly activityFetchHelper: SupervisorActivityFetcher,
  ) {}

  async getAllUserProfile(): Promise<ProfileIdAndUsername[]> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id, username')
      .is('deleted_at', null)
      .order('username', { ascending: true });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getActivityData(
    username: string,
    date: string,
  ): Promise<ActivityData[]> {
    const summariesData =
      await this.activityFetchHelper.getSessionActivityByUserName(
        username,
        date,
      );

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports =
      await this.activityFetchHelper.getRawActivityRawIds(allRawIds);

    const data = this.activityFetchHelper.mapToActivityData(
      allReports,
      summariesData,
    );

    return data;
  }

  async getDailyActivity(userId: string, date: string) {
    return await this.activityFetchHelper.getDailyActivity(userId, date);
  }
}
