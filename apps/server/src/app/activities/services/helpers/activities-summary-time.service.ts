import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { startOfWeek } from 'date-fns/startOfWeek';
import {
  formatInTimeZone,
  toZonedTime,
} from 'date-fns-tz';
import {
  DailySummaryResponse,
  UserSummaryTimeResponse,
  WeeklySummaryResponse,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TIMEZONE } from 'src/constants/timezone';
import {
  RPCFunctionName,
  TableName,
} from 'src/services/supabase/supabase.interface';

@Injectable()
export class ActivitiesSummaryTimeService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}
  async getDailySummaryTime(
    userId: string,
    date: string,
  ): Promise<DailySummaryResponse> {
    const formattedDate = formatInTimeZone(
      parseISO(date),
      TIMEZONE,
      'yyyy-MM-dd',
    );
    const { data, error } = await this.supabase.rpc(
      RPCFunctionName.GET_USER_SCREEN_REPORT_BY_DATE,
      {
        p_user_id: userId,
        p_date: formattedDate,
      },
    );

    if (error) {
      console.error(error);
      throw error;
    }

    return data?.[0] || { total_work_time_minutes: 0 };
  }

  async getWeeklySummaryTime(
    userId: string,
    date: string,
  ): Promise<WeeklySummaryResponse> {
    const formattedDate = formatInTimeZone(
      parseISO(date),
      TIMEZONE,
      'yyyy-MM-dd',
    );

    const { data, error } = await this.supabase.rpc(
      RPCFunctionName.GET_USER_SCREEN_REPORT_WEEKLY,
      {
        p_user_id: userId,
        p_date: formattedDate,
      },
    );

    if (error) {
      console.error('Error fetching weekly summary:', error);
      throw error;
    }

    return (
      data?.[0] || {
        user_id: userId,
        total_work_time_minutes: 0,
        week_start: null,
        week_end: null,
      }
    );
  }

  async getActivityAdjustment(userId: string, date: string) {
    const zonedDate = toZonedTime(parseISO(date), TIMEZONE);

    const monday = startOfWeek(zonedDate, { weekStartsOn: 1 });
    const sunday = endOfWeek(zonedDate, { weekStartsOn: 1 });

    const startDate = format(monday, 'yyyy-MM-dd');
    const endDate = format(sunday, 'yyyy-MM-dd');

    const { data, error } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .select('affected_minutes, date, adjustment:adjusment_id(name)')
      .eq('profile_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getSummaryTime(
    userId: string,
    date: string,
  ): Promise<UserSummaryTimeResponse> {
    const [dailySummaryTime, weeklySummaryTime, activityAdjustment] =
      await Promise.all([
        this.getDailySummaryTime(userId, date),
        this.getWeeklySummaryTime(userId, date),
        this.getActivityAdjustment(userId, date),
      ]);

    return { dailySummaryTime, weeklySummaryTime, activityAdjustment };
  }
}
