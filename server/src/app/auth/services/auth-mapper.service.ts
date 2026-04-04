import { Inject, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { ProfilesDbInsert } from '../interfaces/profiles.interface';
import * as bcrypt from 'bcryptjs';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class AuthMapperService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async getDivisionNameByDivisionId(
    division_id: string,
  ): Promise<string> {
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

  async mapRegisterFormToDb(raw: RegisterDto): Promise<ProfilesDbInsert> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(raw.password, salt);

    const division = await this.getDivisionNameByDivisionId(raw.division)

    return {
      email: raw.email,
      full_name: raw.fullName,
      password: hashedPassword,
      role: raw.role ?? 'worker',
      username: raw.username,
      division_id: Number(raw.division),
      division,
      updated_at: new Date().toISOString(),
    };
  }
}
