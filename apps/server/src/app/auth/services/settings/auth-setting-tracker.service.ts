import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TrackerMode, UserSettings } from '../../interfaces/profiles.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class AuthSettingTrackerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async getUserSettingById(userId: string): Promise<UserSettings> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('settings')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`User ${userId} not found`);

    return data.settings;
  }

  async updateTrackerMode(userId: string, newMode: string) {
    const allSettings = await this.getUserSettingById(userId);
    const newSetting: UserSettings = {
      ...allSettings,
      tracker: {
        ...allSettings.tracker,
        mode: newMode as TrackerMode,
      },
    };

    const { error } = await this.supabase
      .from(TableName.Profiles)
      .update({ settings: newSetting })
      .eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
