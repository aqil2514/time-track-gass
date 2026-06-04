import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesDb, ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import * as bcrypt from 'bcryptjs';

export function getIdentifierColumn(identifier: string): 'email' | 'username' {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) ? 'email' : 'username';
}

export async function getLoginUser(
  prismaService: PrismaService,
  identifier: string,
): Promise<ProfilesDb> {
  const column = getIdentifierColumn(identifier);

  const user = await prismaService.profiles.findFirst({
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

export function ensurePasswordNotResetRequired(user: ProfilesDb): void {
  if (user.must_reset_password) {
    throw new UnauthorizedException('Password must be reset');
  }
}

export async function ensurePasswordValid(
  inputPassword: string,
  hashedPassword: string,
): Promise<void> {
  const isValid = await bcrypt.compare(inputPassword, hashedPassword);
  if (!isValid) throw new UnauthorizedException('Invalid password');
}

export function ensureSupervisorRole(user: ProfilesDb): void {
  if (user.role !== 'supervisor') throw new ForbiddenException('Acces denied');
}

export function buildLoginResponse(user: ProfilesDb): ProfilesWithNoPassword {
  const { password: _, ...result } = user;
  return result;
}
