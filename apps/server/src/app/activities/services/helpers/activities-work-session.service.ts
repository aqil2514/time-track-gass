import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { endOfDay, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { TableName } from 'src/services/supabase/supabase.interface';
import {
  WorkSessionItem,
  WorkSessionReport,
} from '../../interface/work_session.interface';
import { TIMEZONE } from 'src/constants/timezone';

@Injectable()
export class ActivitiesWorkSession {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

  async getWorkSession(
    userId: string,
    date: string,
  ): Promise<Omit<WorkSessionItem, 'reports'>[]> {
    const zonedTime = toZonedTime(date, TIMEZONE);
    const start = startOfDay(zonedTime);
    const end = endOfDay(zonedTime);

    const { data, error } = await this.supabase
      .from(TableName.WorkSessions)
      .select('id, start_at, end_at')
      .eq('user_id', userId)
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString());

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getWorkReport(
    userId: string,
    date: string,
  ): Promise<WorkSessionReport[]> {
    const zonedTime = toZonedTime(date, TIMEZONE);
    const start = startOfDay(zonedTime);
    const end = endOfDay(zonedTime);

    const { data, error } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('id, created_at, app_name, window_title, summary, category')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  mapToWorkSessionReport(
    sessions: Omit<WorkSessionItem, 'reports'>[],
    reports: WorkSessionReport[],
  ): WorkSessionItem[] {
    const mappedSessions: WorkSessionItem[] = sessions.map((session) => {
      const sessionStart = session.start_at;
      const sessionEnd = session.end_at || new Date().toISOString();

      const reportsInSession = reports.filter((report) => {
        return (
          report.created_at >= sessionStart && report.created_at <= sessionEnd
        );
      });

      return {
        end_at: session.end_at,
        id: session.id,
        start_at: session.start_at,
        reports: reportsInSession,
      };
    });

    return mappedSessions;
  }
}
