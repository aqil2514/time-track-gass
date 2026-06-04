import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export function getIdentifierColumn(identifier: string): 'email' | 'username' {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) ? 'email' : 'username';
}

export async function getResetPasswordUser(
  prisma: PrismaService,
  identifier: string,
): Promise<ProfilesDb> {
  const column = getIdentifierColumn(identifier);
  const user = await prisma.profiles.findFirst({
    where: { [column]: identifier },
  });
  if (!user) throw new NotFoundException('user not found');
  return {
    ...user,
    division_id: user.division_id ? Number(user.division_id) : undefined,
    created_at: (user.created_at as any)?.toISOString?.() ?? user.created_at,
    updated_at: user.updated_at ? ((user.updated_at as any)?.toISOString?.() ?? user.updated_at) : undefined,
  } as unknown as ProfilesDb;
}

export function ensureUserCanResetPassword(user: ProfilesDb): void {
  if (!user.must_reset_password) {
    throw new UnauthorizedException('Password reset is not available');
  }
}

export function buildCheckResetPasswordResponse(user: ProfilesDb) {
  return {
    success: true,
    mustResetPassword: user.must_reset_password,
  };
}
