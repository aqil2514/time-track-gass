import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { UserSettings } from '../../interfaces/profiles.interface';

@Injectable()
export class AuthSettingService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getUserSettingById(userId: string): Promise<UserSettings> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('settings')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data.settings;
  }
}
