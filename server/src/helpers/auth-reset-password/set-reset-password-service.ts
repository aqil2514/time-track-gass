import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';

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

export function buildSetResetPasswordResponse() {
  return {
    success: true,
    message: 'Password updated successfully',
  };
}
