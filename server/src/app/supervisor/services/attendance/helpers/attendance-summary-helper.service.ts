import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
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
}
