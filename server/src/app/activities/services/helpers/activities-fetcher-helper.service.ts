import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { SessionSummaryDb } from '../../interface/session_summary.interface';

@Injectable()
export class ActivitiesFetcherHelper {
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

  async getRawActivityRawIds(raw_ids: string[]) {
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
}
