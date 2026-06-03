import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ProfilesWithNoPassword } from './interfaces/profiles.interface';
import {
  buildLoginResponse,
  ensurePasswordNotResetRequired,
  ensurePasswordValid,
  ensureSupervisorRole,
  getLoginUser,
} from 'src/helpers/auth/login.helper';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
