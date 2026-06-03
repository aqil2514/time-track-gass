import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ProfilesWithNoPassword } from '../interfaces/profiles.interface';
import {
  buildLoginResponse,
  ensurePasswordNotResetRequired,
  ensurePasswordValid,
  ensureSupervisorRole,
  getLoginUser,
} from 'src/helpers/auth/login.helper';
import {
  buildRegisterPayload,
  ensureEmailNotTaken,
  ensureUsernameNotTaken,
  getDivisionName,
  insertProfile,
} from 'src/helpers/auth/createNewProfile.helper';
import {
  buildCheckResetPasswordResponse,
  ensureUserCanResetPassword,
  getResetPasswordUser,
} from 'src/helpers/auth/checkResetPassword.helper';
import {
  buildResetPasswordPayload,
  buildSetResetPasswordResponse,
  ensureResetPasswordAllowed,
  hashNewPassword,
  updateProfile,
} from 'src/helpers/auth/setResetPassword.helper';
import { CheckResetPasswordDto } from '../dto/check-reset-password.dto';
import { SetResetPasswordDto } from '../dto/set-reset-password.dto';

@Injectable()
export class AuthCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async login(
    loginData: LoginDto,
    isSuperVisor: boolean = false,
  ): Promise<ProfilesWithNoPassword> {
    const { identifier, password } = loginData;

    // Step 1: Ambil user dari DB berdasarkan email/username
    const user = await getLoginUser(this.prisma, identifier);

    // Step 2: Pastikan user tidak dalam status harus reset password
    ensurePasswordNotResetRequired(user);

    // Step 3: Validasi password
    await ensurePasswordValid(password, user.password);

    // Step 4: Jika login supervisor, pastikan role sesuai
    if (isSuperVisor) ensureSupervisorRole(user);

    // Step 5: Return user tanpa password
    return buildLoginResponse(user);
  }

  async createNewProfile(raw: RegisterDto): Promise<void> {
    // Step 1 & 2: Pastikan username dan email belum dipakai (paralel)
    await Promise.all([
      ensureUsernameNotTaken(this.prisma, raw.username),
      ensureEmailNotTaken(this.prisma, raw.email),
    ]);

    // Step 3: Ambil nama divisi dari DB
    const divisionName = await getDivisionName(this.prisma, raw.division);

    // Step 4: Build payload (hash password + mapping)
    const payload = await buildRegisterPayload(raw, divisionName);

    // Step 5: Insert profile ke DB
    await insertProfile(this.prisma, payload);

    // Step 6: Emit event profile created
    this.eventEmitter.emit('profile.created', payload);
  }

  async checkResetPassword(body: CheckResetPasswordDto) {
    // Step 1: Ambil user dari DB berdasarkan email/username
    const user = await getResetPasswordUser(this.prisma, body.identifier);

    // Step 2: Pastikan user memang harus reset password
    ensureUserCanResetPassword(user);

    // Step 3: Build response
    return buildCheckResetPasswordResponse(user);
  }

  async setResetPassword(body: SetResetPasswordDto) {
    // Step 1: Ambil user dari DB berdasarkan email/username
    const user = await getResetPasswordUser(this.prisma, body.identifier);

    // Step 2: Pastikan user memang boleh reset password
    ensureResetPasswordAllowed(user);

    // Step 3: Hash password baru
    const hashedPassword = await hashNewPassword(body.password);

    // Step 4: Build payload update
    const payload = buildResetPasswordPayload(hashedPassword);

    // Step 5: Update profile di DB
    await updateProfile(this.prisma, user.id, payload);

    // Step 6: Build response
    return buildSetResetPasswordResponse();
  }
}
