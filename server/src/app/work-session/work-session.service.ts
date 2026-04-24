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
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async createNewWorkSession(userId: string) {
    const isExistingSession = await this.getCurrentWorkSession(userId);
    if (isExistingSession) {
      throw new Error('An active work session already exists');
    }

    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .insert({ user_id: userId, start_at: new Date().toISOString() });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async endCurrentWorkSession(userId: string, end_at?: Date) {
    const currentSession = await this.getCurrentWorkSession(userId);
    if (!currentSession) {
      throw new Error('No active work session found');
    }

    const { error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .update({ end_at: (end_at ?? new Date()).toISOString() })
      .eq('id', currentSession.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // CRON
  async getActiveSessions() {
    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .select('id, user_id, end_at, start_at')
      .is('end_at', null);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getLastUserActivity(userId: string) {
    const { data, error } = await this.supabaseClient
      .from(TableName.AIScreenReport)
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data ? new Date(data.created_at) : null;
  }
}
