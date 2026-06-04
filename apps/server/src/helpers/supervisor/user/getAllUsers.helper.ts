import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';

export async function getAllUsers(
  prisma: PrismaService,
): Promise<ProfilesWithNoPassword[]> {
  const data = await prisma.profiles.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      email: true,
      username: true,
      full_name: true,
      role: true,
      division: true,
    },
    orderBy: { full_name: 'asc' },
  });

  return data as unknown as ProfilesWithNoPassword[];
}
