import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class SupervisorUserHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async checkUniqueness(email: string, username: string, excludeId?: string) {
    let query = this.supabase
      .from(TableName.Profiles)
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      const conflict = data[0];
      if (conflict.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (conflict.username === username) {
        throw new ConflictException('Username already exists');
      }
    }
  }

  async getDivisionNameByDivisionId(division_id: string): Promise<string> {
    const { data, error } = await this.supabase
      .from(TableName.Divisions)
      .select('name')
      .eq('id', division_id)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data?.name;
  }
}
