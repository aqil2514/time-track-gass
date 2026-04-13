import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';
import {
  ProfileWorkConfigsDbInsert,
  ProfileWorkConfigsPopulateProfile,
} from '../../interfaces/attendances/profile-work-configs.interface';
import { CreateUserManagementDto } from '../../dto/attendance/profile-config.dto';

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
      penalty_type,
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

  async updateNewProfileConfig(raw: CreateUserManagementDto, userId: string) {
    const payload: ProfileWorkConfigsDbInsert = {
      bonus_per_hour: raw.hourlyBonus,
      min_hours_monthly: raw.monthlyHour,
      min_hours_weekly: raw.weeklyHour,
      penalty_per_hour: raw.hourlyPenalty,
      penalty_type: raw.penaltyType,
      profile_id: raw.userId,
    };

    const {error} = await this.supabase
      .from(TableName.ProfileWorkConfigs)
      .update(payload)
      .eq('profile_id', userId);

      if(error){
        console.error(error);
        throw error
      }
  }
}
