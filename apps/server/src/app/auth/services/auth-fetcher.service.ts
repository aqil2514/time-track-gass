import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class AuthFetcherService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllDivisions() {
    const { data, error } = await this.supabase
      .from(TableName.Divisions)
      .select('name, id')
      .notIn('id', [8, 1]); // 8 = Semua Divisi. 1 = Test

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
