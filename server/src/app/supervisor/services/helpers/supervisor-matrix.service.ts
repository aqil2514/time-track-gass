import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import {
  AIScreenReportPopulateUser,
  TotalWeeklyActivity,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  activity: number[];
  totalWeeklyActivity: number;
}

@Injectable()
export class SupervisorMatrixService {
  // TODO Ini nanti intervalnya ambil dari databse kalo fitur udah siap
  private readonly INTERVAL = 5;
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getActiveUsers(): Promise<ProfilesDb[]> {
    const { error, data } = await this.supabase
      .from(TableName.Profiles)
      .select('*')
      .is('deleted_at', null)
      .order('username');
    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getOneDayActivity(
    userIds: string[],
    date: string,
  ): Promise<AIScreenReportPopulateUser[]> {
    const BATCH_SIZE = 500;
    let from = 0;
    let to = BATCH_SIZE - 1;
    let hasMore = true;
    const finalData: AIScreenReportPopulateUser[] = [];

    const dateOnly = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const startStr = `${dateOnly}T00:00:00+07:00`;
    const endStr = `${dateOnly}T23:59:59+07:00`;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from(TableName.AIScreenReport)
        .select(
          '*, user:user_id(id,role, email, division, username, full_name)',
        )
        .in('user_id', userIds)
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .neq('category', 'unclassified')
        .range(from, to)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        throw error;
      }

      if (data && data.length > 0) {
        finalData.push(...data);
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          from += BATCH_SIZE;
          to += BATCH_SIZE;
        }
      } else {
        hasMore = false;
      }
    }

    return finalData;
  }

  async getTrackerWeekly(date: string) {
    const localDate = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
    const dayOfWeek = localDate.getUTCDay();

    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    const endOfWeek = new Date(localDate);
    endOfWeek.setUTCDate(localDate.getUTCDate() + daysUntilSunday);
    const endDateOnly = endOfWeek.toISOString().split('T')[0];

    const endStr = `${endDateOnly}T23:59:59+07:00`;


    const { data, error } = await this.supabase.rpc(
      'get_weekly_user_activity_by_date',
      { client_date: endStr },
    );

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  mapToMatrixData(
    rawData: AIScreenReportPopulateUser[],
    users: ProfilesDb[],
    weeklyActivity: TotalWeeklyActivity[],
  ) {
    const finalMatrix: MatrixResponse[] = [];

    for (const user of users) {
      const selectedActivity = rawData.filter(
        (data) => data.user.id === user.id,
      );
      const selectedWeeklyActivity = weeklyActivity.find(
        (activity) => activity.user_id === user.id,
      );

      const hourlyActivity: number[] = new Array(24).fill(0);

      for (let hour = 0; hour < 24; hour++) {
        const activityInThisHour = selectedActivity.filter((data) => {
          const reportDate = new Date(data.created_at);
          const wibHour = new Date(
            reportDate.getTime() + 7 * 60 * 60 * 1000,
          ).getUTCHours();
          return wibHour === hour;
        });

        hourlyActivity[hour] = activityInThisHour.length;
      }

      const totalWeeklyActivity =
        selectedWeeklyActivity?.total_activity * this.INTERVAL || 0;

      const matrixData: MatrixResponse = {
        fullName: user.full_name,
        userId: user.id,
        userName: user.username,
        activity: hourlyActivity,
        totalWeeklyActivity,
      };

      finalMatrix.push(matrixData);
    }

    return finalMatrix;
  }
}
