import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  RPCFunctionName,
  TableName,
} from 'src/services/supabase/supabase.interface';
import { SessionSummaryDb } from '../../interface/session_summary.interface';
import { ActivityData } from '../../interface/activities_data.interface';
import {
  AIScreenReportDb,
  DailySummaryResponse,
  UserSummaryTimeResponse,
  WeeklySummaryResponse,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { DailySummaryDb } from '../../interface/daily_summary.interface';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { DailySummaryPerCategory } from '../../interface/daily_summary_per_category.interface';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class ActivitiesFetcherHelper {
  private readonly APP_TIMEZONE = 'Asia/Jakarta';

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getSessionActivityByUserId(
    userId: string,
    date: string,
  ): Promise<SessionSummaryDb[]> {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data, error } = await this.supabase
      .from('session_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('session_start', start.toISOString())
      .lt('session_start', end.toISOString())
      .order('session_start', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getRawActivityRawIds(raw_ids: string[]): Promise<AIScreenReportDb[]> {
    const { error, data } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .in('id', raw_ids)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getDailyActivity(
    userId: string,
    date: string,
  ): Promise<DailySummaryDb> {
    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    const { data, error } = await this.supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start.toISOString())
      .lt('date', end.toISOString())
      .limit(1);

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data || data.length === 0) return undefined;

    return data[0];
  }

  async getDailyActivityPerCategory(
    userId: string,
    date: string,
  ): Promise<DailySummaryPerCategory[]> {
    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    const { data, error } = await this.supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start.toISOString())
      .lt('date', end.toISOString());

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  mapToActivityData(
    allReports: AIScreenReportDb[],
    summariesData: SessionSummaryDb[],
  ): ActivityData[] {
    const reportMap = new Map(allReports.map((r) => [r.id, r]));

    const data: ActivityData[] = summariesData.map((summary) => {
      const { raw_ids, ...rest } = summary;

      return {
        ...rest,
        items: raw_ids.map((id) => reportMap.get(id)).filter(Boolean),
      };
    });

    return data;
  }

  // Summary time

  async getDailySummaryTime(
    userId: string,
    date: string,
  ): Promise<DailySummaryResponse> {
    const formattedDate = formatInTimeZone(
      parseISO(date),
      this.APP_TIMEZONE,
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
      this.APP_TIMEZONE,
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

  async getSummaryTime(
    userId: string,
    date: string,
  ): Promise<UserSummaryTimeResponse> {
    const [dailySummaryTime, weeklySummaryTime] = await Promise.all([
      this.getDailySummaryTime(userId, date),
      this.getWeeklySummaryTime(userId, date),
    ]);

    return { dailySummaryTime, weeklySummaryTime };
  }
}
