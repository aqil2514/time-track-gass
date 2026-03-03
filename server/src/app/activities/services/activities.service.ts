import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getActivityByUserId(userId: string) {
    const { error, data } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
