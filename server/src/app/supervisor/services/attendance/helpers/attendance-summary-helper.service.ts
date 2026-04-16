import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { ActivityAdjusmentsDb } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';
import {
  AttendanceLogsDbPopulatedProfile,
  AttendanceLogsRpc,
} from 'src/app/supervisor/interfaces/attendances/attendances-logs.interface';
import { ProfileWorkConfigsDb } from 'src/app/supervisor/interfaces/attendances/profile-work-configs.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class AttendanceSummaryHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAttendanceSummaryByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<AttendanceLogsDbPopulatedProfile[]> {
    const { data, error } = await this.supabase
      .from(TableName.AttendanceLogs)
      .select(
        `
      *,
      profile:profiles (*)
    `,
      )
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true });

    if (error) throw error;

    return data as unknown as AttendanceLogsDbPopulatedProfile[];
  }

  async getAttendanceSummaryByDateRangeAndUserId(
    startDate: string,
    endDate: string,
    userId: string,
  ) {
    const { data, error } = await this.supabase
      .from(TableName.AttendanceLogs)
      .select(`id, work_date, duration_minutes`)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .eq('profile_id', userId)
      .order('work_date', { ascending: true });

    if (error) throw error;

    return data;
  }

  async getAttendanceAdjustmentByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ActivityAdjusmentsDb[]> {
    const { error, data } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    return data;
  }

  async getAttendanceAdjustmentByUserId(
    startDate: string,
    endDate: string,
    userId: string,
  ) {
    const { error, data } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .select(
        'id, adjustment:adjusment_id(id, name, notes), date, affected_minutes',
      )
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('profile_id', userId);

    if (error) throw error;

    return data;
  }

  async getAttendanceSummaryToday(): Promise<AttendanceLogsRpc[]> {
    const { data, error } = await this.supabase.rpc('get_screen_report_today');

    if (error) throw error;

    return data ?? [];
  }

  async getUserConfigData(): Promise<ProfileWorkConfigsDb[]> {
    const { data, error } = await this.supabase
      .from(TableName.ProfileWorkConfigs)
      .select('*');

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select(
        "id, full_name, username, email, division"
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
