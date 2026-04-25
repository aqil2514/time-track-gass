import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';
import { LogService } from '../log/log.service';

@Injectable()
export class WorkSessionService {
  private readonly logger = new Logger(WorkSessionService.name);
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabaseClient: SupabaseClient,
    private readonly logService: LogService,
  ) {}

  private async getCurrentWorkSession(userId: string) {
    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .select()
      .eq('user_id', userId)
      .is('end_at', null)
      .maybeSingle();

    if (error) {
      await this.logService.createNewLog(userId, {
        context: 'Fungsi ambil sesi jam kerja (getCurrentWorkSession)',
        level: 'ERROR',
        message: error.message,
        metadata: error,
        os: 'server',
      });
      throw new Error(error.message);
    }
    return data;
  }

  async createNewWorkSession(userId: string) {
    const isExistingSession = await this.getCurrentWorkSession(userId);
    if (isExistingSession) {
      await this.logService.createNewLog(userId, {
        context: 'Fungsi buat sesi jam kerja baru (createNewWorkSession)',
        level: 'WARN',
        message: `Sesi kerja yang aktif untuk user ${userId} tersebut masih ada`,
        metadata: {},
        os: 'server',
      });
      this.logger.warn(
        `Sesi kerja yang aktif untuk user ${userId} tersebut masih ada`,
      );
      return;
    }

    const { data, error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .insert({ user_id: userId, start_at: new Date().toISOString() });

    if (error) {
      await this.logService.createNewLog(userId, {
        context: 'Fungsi ambil sesi jam kerja (getCurrentWorkSession)',
        level: 'ERROR',
        message: error.message,
        metadata: error,
        os: 'server',
      });
      throw new Error(error.message);
    }
    return data;
  }

  async endCurrentWorkSession(userId: string, end_at?: Date) {
    const currentSession = await this.getCurrentWorkSession(userId);
    if (!currentSession) {
      await this.logService.createNewLog(userId, {
        context: 'Fungsi ambil sesi jam kerja (endCurrentWorkSession)',
        level: 'WARN',
        message: 'Tidak ada sesi jam kerja yang aktif',
        metadata: {},
        os: 'server',
      });
      this.logger.warn(
        `Tidak ada sesi jam kerja yang aktif dari user ${userId}`,
      );
      return;
    }

    const { error } = await this.supabaseClient
      .from(TableName.WorkSessions)
      .update({ end_at: (end_at ?? new Date()).toISOString() })
      .eq('id', currentSession.id);

    if (error) {
      await this.logService.createNewLog(userId, {
        context: 'Fungsi ambil sesi jam kerja (endCurrentWorkSession)',
        level: 'ERROR',
        message: error.message,
        metadata: error,
        os: 'server',
      });
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
