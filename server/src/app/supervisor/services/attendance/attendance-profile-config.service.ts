import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ProfileWorkConfigsPopulateProfile } from '../../interfaces/attendances/profile-work-configs.interface';

@Injectable()
export class AttendanceProfileConfigService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllProfileConfig(): Promise<ProfileWorkConfigsPopulateProfile[]> {
    const { data, error } = await this.supabase
      .from(TableName.ProfileWorkConfigs)
      .select(
        `
      id, 
      profile:profile_id(
        id,
        username,
        full_name,
        division
      ),
      min_hours_weekly, 
      min_hours_monthly, 
      penalty_per_hour, 
      bonus_per_hour, 
      created_at
    `,
      );

    if (error) {
      console.error('Supabase Error:', error.message);
      throw error;
    }

    return data as unknown as ProfileWorkConfigsPopulateProfile[];
  }
}
