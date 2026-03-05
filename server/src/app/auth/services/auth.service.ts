import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthMapperService } from './auth-mapper.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { TableName } from 'src/services/supabase/supabase.interface';
import {
  ProfilesDb,
  ProfilesWithNoPassword,
} from '../interfaces/profiles.interface';

import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly mapper: AuthMapperService,

    private readonly supabaseService: SupabaseService,
  ) {}

  private isEmailIdentifier(identifier: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  }

  async createNewProfile(raw: RegisterDto) {
    const [isUsernameTaken, isEmailTaken] = await Promise.all([
      this.supabaseService.isExistValue(
        TableName.Profiles,
        'username',
        raw.username,
      ),
      this.supabaseService.isExistValue(TableName.Profiles, 'email', raw.email),
    ]);

    if (isUsernameTaken) throw new ConflictException('Username already exists');
    if (isEmailTaken) throw new ConflictException('Email already exists');

    const payload = await this.mapper.mapRegisterFormToDb(raw);

    await this.supabaseService.createNewData(TableName.Profiles, payload);
  }

  async login(
    loginData: LoginDto,
    isSuperVisor: boolean = false,
  ): Promise<ProfilesWithNoPassword> {
    const { identifier, password } = loginData;
    const isEmail = this.isEmailIdentifier(identifier);

    const isExistAccount = await this.supabaseService.isExistValue(
      TableName.Profiles,
      isEmail ? 'email' : 'username',
      identifier,
    );

    if (!isExistAccount) throw new NotFoundException('user not found');
    const user = await this.supabaseService.getDataByColumn<ProfilesDb>(
      TableName.Profiles,
      isEmail ? 'email' : 'username',
      identifier,
    );

    const { password: hashedPassword, ...result } = user[0];

    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassword) throw new UnauthorizedException('Invalid password');

    if (isSuperVisor && result.role !== 'supervisor')
      throw new ForbiddenException('Acces denied');

    return result;
  }
}
