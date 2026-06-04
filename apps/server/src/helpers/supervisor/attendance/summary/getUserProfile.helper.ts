import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getUserProfile(prisma: PrismaService, userId: string) {
  return prisma.profiles.findUnique({
    where: { id: userId },
    select: { id: true, full_name: true, username: true, email: true, division: true },
  });
}
