import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export function ensureResetPasswordAllowed(user: ProfilesDb): void {
  if (!user.must_reset_password) {
    throw new UnauthorizedException('Password reset is not available');
  }
}

export async function hashNewPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export function buildResetPasswordPayload(password: string) {
  return {
    password,
    must_reset_password: false,
    updated_at: new Date().toISOString(),
  };
}

export async function updateProfile(
  prisma: PrismaService,
  id: string,
  payload: Partial<ProfilesDb>,
): Promise<void> {
  await prisma.profiles.update({ where: { id }, data: payload as any });
}

export function buildSetResetPasswordResponse() {
  return {
    success: true,
    message: 'Password updated successfully',
  };
}
