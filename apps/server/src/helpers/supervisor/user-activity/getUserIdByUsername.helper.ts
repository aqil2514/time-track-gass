import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getUserIdByUsername(prisma: PrismaService, username: string): Promise<string> {
  const profile = await prisma.profiles.findFirst({
    where: { username },
    select: { id: true },
  });

  if (!profile) throw new NotFoundException('User not found');

  return profile.id;
}
