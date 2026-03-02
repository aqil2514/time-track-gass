import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { AuthMapperService } from './auth-mapper.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly mapper: AuthMapperService,

    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  private async isExistValue(column: string, value: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id') // select minimal, tidak perlu '*'
      .eq(column, value)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async createNewProfile(raw: RegisterDto) {
    const [isUsernameTaken, isEmailTaken] = await Promise.all([
      this.isExistValue('username', raw.username),
      this.isExistValue('email', raw.email),
    ]);

    if (isUsernameTaken) throw new ConflictException('Username already exists');
    if (isEmailTaken) throw new ConflictException('Email already exists');

    const payload = await this.mapper.mapRegisterFormToDb(raw);

    const { error } = await this.supabase.from('profiles').insert(payload);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
