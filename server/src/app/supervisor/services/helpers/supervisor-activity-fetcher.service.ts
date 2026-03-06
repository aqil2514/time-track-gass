import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { endOfDay, startOfDay } from 'date-fns';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';
import { DailySummaryDb } from 'src/app/activities/interface/daily_summary.interface';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class SupervisorActivityFetcher {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async getUserIdByUsername(username: string): Promise<string> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data) throw new NotFoundException('user not found');

    return data.id;
  }

  async getSessionActivityByUserName(
    username: string,
    date: string,
  ): Promise<SessionSummaryDb[]> {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const userId = await this.getUserIdByUsername(username);

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

  async getDailyActivity(
    username: string,
    date: string,
  ): Promise<DailySummaryDb> {
    const userId = await this.getUserIdByUsername(username);

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
}
