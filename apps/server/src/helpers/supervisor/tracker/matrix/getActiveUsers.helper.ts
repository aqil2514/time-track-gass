import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';

export async function getActiveUsers(
  prisma: PrismaService,
): Promise<ProfilesDb[]> {
  const data = await prisma.profiles.findMany({
    where: { deleted_at: null },
    orderBy: { username: 'asc' },
  });

  return data as unknown as ProfilesDb[];
}
