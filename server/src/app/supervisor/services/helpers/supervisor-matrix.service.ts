import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { endOfDay, format, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import { AIScreenReportPopulateUser } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  activity: number[];
}

@Injectable()
export class SupervisorMatrixService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getActiveUsers(): Promise<ProfilesDb[]> {
    const { error, data } = await this.supabase
      .from(TableName.Profiles)
      .select('*')
      .is('deleted_at', null);
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

    console.log('startStr:', startStr);
    console.log('endStr:', endStr);

    while (hasMore) {
      const { data, error } = await this.supabase
        .from(TableName.AIScreenReport)
        .select(
          '*, user:user_id(id,role, email, division, username, full_name)',
        )
        .in('user_id', userIds)
        .gte('created_at', startStr)
        .lte('created_at', endStr)
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

  mapToMatrixData(rawData: AIScreenReportPopulateUser[], users: ProfilesDb[]) {
    const finalMatrix: MatrixResponse[] = [];

    for (const user of users) {
      const selectedActivity = rawData.filter(
        (data) => data.user.id === user.id,
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

      const matrixData: MatrixResponse = {
        fullName: user.full_name,
        userId: user.id,
        userName: user.username,
        activity: hourlyActivity,
      };

      finalMatrix.push(matrixData);
    }

    return finalMatrix;
  }
}
