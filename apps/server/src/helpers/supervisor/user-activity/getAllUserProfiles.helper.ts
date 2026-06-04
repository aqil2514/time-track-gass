import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAllUserProfiles(prisma: PrismaService) {
  return prisma.profiles.findMany({
    where: { deleted_at: null },
    select: { id: true, username: true, division: true },
    orderBy: { username: 'asc' },
  });
}
