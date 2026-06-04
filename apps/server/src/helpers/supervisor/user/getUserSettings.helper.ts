import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getUserSettings(
  prisma: PrismaService,
  id: string,
) {
  return prisma.profiles.findUnique({
    where: { id },
    select: { id: true, settings: true },
  });
}
