import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesDb } from 'src/app/auth/interfaces/profiles.interface';

export async function getActiveUsers(
  prisma: PrismaService,
): Promise<ProfilesDb[]> {
  const data = await prisma.profiles.findMany({
    where: { deleted_at: null },
    orderBy: { username: 'asc' },
  });

  return data.map((row) => ({
    ...row,
    division_id: row.division_id ? Number(row.division_id) : undefined,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    updated_at: row.updated_at ? ((row.updated_at as any)?.toISOString?.() ?? row.updated_at) : undefined,
  })) as unknown as ProfilesDb[];
}
