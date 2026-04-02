import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { DivisionsDb } from '../../interfaces/divisions.interface';

@Injectable()
export class SupervisorDivisionHelperService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllDivisions(): Promise<DivisionsDb[]> {
    const { data, error } = await this.supabase
      .from(TableName.Divisions)
      .select('*');

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
