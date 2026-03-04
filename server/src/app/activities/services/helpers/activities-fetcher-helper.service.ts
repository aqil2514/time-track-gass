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
  ): Promise<SessionSummaryDb[]> {
    const { data, error } = await this.supabase
      .from('session_summary')
      .select('*')
      .eq('user_id', userId)
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
