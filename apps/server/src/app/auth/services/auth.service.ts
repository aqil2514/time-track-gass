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
import { CheckResetPasswordDto } from '../dto/check-reset-password.dto';
import { SetResetPasswordDto } from '../dto/set-reset-password.dto';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { TableName } from 'src/services/supabase/supabase.interface';
import {
  ProfilesDb,
  ProfilesWithNoPassword,
} from '../interfaces/profiles.interface';

import * as bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  buildCheckResetPasswordResponse,
  getResetPasswordUser,
  ensureUserCanResetPassword,
} from 'src/helpers/auth/auth-reset-password/check-reset-password-service';
import {
  buildResetPasswordPayload,
  buildSetResetPasswordResponse,
  ensureResetPasswordAllowed,
  hashNewPassword,
} from 'src/helpers/auth/auth-reset-password/set-reset-password-service';

@Injectable()
export class AuthService {
  constructor(
    private readonly mapper: AuthMapperService,

    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly supabaseService: SupabaseService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async updateProfileById(id: string, payload: Partial<ProfilesDb>) {
    const { error } = await this.supabase
      .from(TableName.Profiles)
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error(error);
      throw error;
    }
  }

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
    this.eventEmitter.emit('profile.created', payload);
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

    if (result.must_reset_password) {
      throw new UnauthorizedException('Password must be reset');
    }

    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassword) throw new UnauthorizedException('Invalid password');

    if (isSuperVisor && result.role !== 'supervisor')
      throw new ForbiddenException('Acces denied');

    return result;
  }

  async checkResetPassword(body: CheckResetPasswordDto) {
    const user = await getResetPasswordUser(
      this.supabaseService,
      body.identifier,
    );

    ensureUserCanResetPassword(user);

    return buildCheckResetPasswordResponse(user);
  }

  async setResetPassword(body: SetResetPasswordDto) {
    const user = await getResetPasswordUser(
      this.supabaseService,
      body.identifier,
    );

    ensureResetPasswordAllowed(user);

    const hashedPassword = await hashNewPassword(body.password);
    const payload = buildResetPasswordPayload(hashedPassword);

    await this.updateProfileById(user.id, payload);

    return buildSetResetPasswordResponse();
  }
}
