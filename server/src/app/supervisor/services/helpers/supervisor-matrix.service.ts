import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import {
  AIScreenReportPopulateUser,
  TotalWeeklyActivity,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { WorkSessionDb } from 'src/app/activities/interface/work_session.interface';
import { TIMEZONE } from 'src/constants/timezone';
import { AdjustmentContent } from '../../interfaces/attendances/activity-adjusments.interface';

export interface MatrixResponse {
  userName: string;
  userId: string;
  fullName: string;
  activity: number[];
  totalWeeklyActivity: number;
  workSession?: WorkSessionDb[];
  workAdjustment?: AdjustmentContent[];
}

@Injectable()
export class SupervisorMatrixService {
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
        .is('deleted_at', null)
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

  async getWorkAdjustment(date: string): Promise<AdjustmentContent[]> {
    const zonedTime = toZonedTime(date, TIMEZONE);

    const monday = startOfWeek(zonedTime, { weekStartsOn: 1 });
    const sunday = endOfWeek(zonedTime, { weekStartsOn: 1 });

    const formattedMonday = format(monday, 'yyyy-MM-dd', {
      timeZone: TIMEZONE,
    });
    const formattedSunday = format(sunday, 'yyyy-MM-dd', {
      timeZone: TIMEZONE,
    });

    const { data, error } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .select(
        'id, date, affected_minutes, profile:profile_id(id, full_name, username, division), adjustment:adjusment_id(id, name, notes)',
      )
      .gte('date', formattedMonday)
      .lte('date', formattedSunday);

    if (error) {
      console.error(error);
      throw error;
    }

    return data as unknown as AdjustmentContent[];
  }

  async getWorkSession(date: string): Promise<WorkSessionDb[]> {
    const zonedTime = toZonedTime(date, TIMEZONE);

    const startDate = startOfDay(zonedTime);
    const endDate = endOfDay(zonedTime);

    const { data, error } = await this.supabase
      .from(TableName.WorkSessions)
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

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
    workSession: WorkSessionDb[],
    workAdjustment: AdjustmentContent[],
  ) {
    const finalMatrix: MatrixResponse[] = [];

    for (const user of users) {
      const selectedActivity = rawData.filter(
        (data) => data.user.id === user.id,
      );
      const selectedWeeklyActivity = weeklyActivity.find(
        (activity) => activity.user_id === user.id,
      );
      const selectedWorkSession = workSession.filter(
        (session) => session.user_id === user.id,
      );
      const selectedWorkAdjustment = workAdjustment.filter(
        (adjustment) => adjustment.profile.id === user.id,
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
        workSession: selectedWorkSession,
        workAdjustment: selectedWorkAdjustment,
      };

      finalMatrix.push(matrixData);
    }

    return finalMatrix;
  }
}
