import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class WorkSessionService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabaseClient: SupabaseClient,
  ) {}

  private async getCurrentWorkSession(userId: string) {
    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .select()
      .eq('user_id', userId)
      .is('end_at', null)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async createNewWorkSession(userId: string) {
    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .insert({ user_id: userId, start_at: new Date().toISOString() });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async endCurrentWorkSession(userId: string) {
    const currentSession = await this.getCurrentWorkSession(userId);
    if (!currentSession) {
      throw new Error('No active work session found');
    }
    
    const { error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .update({ end_at: new Date().toISOString() })
      .eq('id', currentSession.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}
