import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class SupervisorUserService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllUserData(): Promise<ProfilesWithNoPassword[]> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id, email, username, full_name, role, division')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    return data as ProfilesWithNoPassword[];
  }
}