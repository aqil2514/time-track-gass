import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AppLogInsertDb, AppLogInsertClient } from './log.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class LogService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async createNewLog(user_id: string, payload: AppLogInsertClient) {
    const dbPayload: AppLogInsertDb = {
      ...payload,
      os: 'server',
      user_id,
    };

    const { error } = await this.supabase
      .from(TableName.AppLogs)
      .insert(dbPayload);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
