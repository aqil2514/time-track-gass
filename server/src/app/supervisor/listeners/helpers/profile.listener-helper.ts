import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { ProfilesDbInsert } from 'src/app/auth/interfaces/profiles.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ProfileWorkConfigsDbInsert } from '../../interfaces/attendances/profile-work-configs.interface';

@Injectable()
export class ProfileListenerHelper {
  private readonly logger = new Logger(ProfileListenerHelper.name);
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async getProfileIdByUsername(username: string): Promise<string> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data) {
      throw new Error(`Profile dengan username ${username} tidak ditemukan.`);
    }

    return data.id;
  }

  async createNewProfileWorkConfig(payload: ProfilesDbInsert) {
    this.logger.log('Menambahkan data user untuk keperluan absensi');
    const profile_id = await this.getProfileIdByUsername(payload.username);
    const mappedData: ProfileWorkConfigsDbInsert = {
      profile_id,
      bonus_per_hour: 0,
      min_hours_monthly: 140,
      min_hours_weekly: 35,
      penalty_per_hour: 30000,
      penalty_type: 'fee',
    };
    const { error } = await this.supabase
      .from(TableName.ProfileWorkConfigs)
      .insert(mappedData);

    if (error) {
      console.error(error);
      this.logger.error('Penambahan data user untuk keperluan absensi gagal');
      throw error;
    }

    this.logger.log('Penambahan data user untuk keperluan absensi berhasil');
  }

  async deleteProfileWorkConfig(userId: string) {
    this.logger.log('Menghapus data konfigurasi absensi user');
    const { error } = await this.supabase
      .from(TableName.ProfileWorkConfigs)
      .delete()
      .eq('profile_id', userId);

    if (error) {
      console.error(error);
      throw error;
    }

    this.logger.log('Data konfigurasi absensi user berhasil dihapus');
  }
}
