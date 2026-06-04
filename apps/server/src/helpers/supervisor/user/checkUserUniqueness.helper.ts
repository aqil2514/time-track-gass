import { ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function checkUserUniqueness(
  prisma: PrismaService,
  email: string,
  username: string,
  excludeId?: string,
): Promise<void> {
  const data = await prisma.profiles.findMany({
    where: {
      deleted_at: null,
      OR: [{ email }, { username }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { email: true, username: true },
  });

  if (data.length > 0) {
    const conflict = data[0];
    if (conflict.email === email) throw new ConflictException('Email already exists');
    if (conflict.username === username) throw new ConflictException('Username already exists');
  }
}
