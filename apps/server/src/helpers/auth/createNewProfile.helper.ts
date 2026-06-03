import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from 'src/app/auth/dto/register.dto';
import { ProfilesDbInsert } from 'src/app/auth/interfaces/profiles.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function ensureUsernameNotTaken(
  prisma: PrismaService,
  username: string,
): Promise<void> {
  const existing = await prisma.profiles.findFirst({ where: { username } });
  if (existing) throw new ConflictException('Username already exists');
}

export async function ensureEmailNotTaken(
  prisma: PrismaService,
  email: string,
): Promise<void> {
  const existing = await prisma.profiles.findFirst({ where: { email } });
  if (existing) throw new ConflictException('Email already exists');
}

export async function getDivisionName(
  prisma: PrismaService,
  divisionId: string,
): Promise<string> {
  const division = await prisma.divisions.findFirst({
    where: { id: Number(divisionId) },
    select: { name: true },
  });
  return division?.name ?? '';
}

export async function buildRegisterPayload(
  raw: RegisterDto,
  divisionName: string,
): Promise<ProfilesDbInsert> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(raw.password, salt);

  return {
    email: raw.email,
    full_name: raw.fullName,
    password: hashedPassword,
    role: raw.role ?? 'worker',
    username: raw.username,
    division_id: Number(raw.division),
    division: divisionName,
    must_reset_password: false,
    updated_at: new Date().toISOString(),
    settings: {
      tracker: {
        allowedMode: ['auto', 'manual'],
        mode: 'manual',
      },
    },
  };
}

export async function insertProfile(
  prisma: PrismaService,
  payload: ProfilesDbInsert,
): Promise<void> {
  await prisma.profiles.create({ data: payload as any });
}
