import { NotFoundException } from '@nestjs/common';
import { UserSettings } from 'src/app/auth/interfaces/profiles.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getUserSetting(
  prisma: PrismaService,
  userId: string,
): Promise<UserSettings> {
  const profile = await prisma.profiles.findFirst({
    where: { id: userId },
    select: { settings: true },
  });

  if (!profile) throw new NotFoundException(`User ${userId} not found`);

  return profile.settings as unknown as UserSettings;
}
