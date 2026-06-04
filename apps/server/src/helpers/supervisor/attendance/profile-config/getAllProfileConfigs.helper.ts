import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfileWorkConfigsPopulateProfile } from 'src/app/supervisor/_interfaces/attendances/profile-work-configs.interface';

export async function getAllProfileConfigs(
  prisma: PrismaService,
): Promise<ProfileWorkConfigsPopulateProfile[]> {
  const data = await prisma.profile_work_configs.findMany({
    select: {
      id: true,
      penalty_type: true,
      min_hours_weekly: true,
      min_hours_monthly: true,
      penalty_per_hour: true,
      bonus_per_hour: true,
      created_at: true,
      profiles: {
        select: { id: true, username: true, full_name: true, division: true },
      },
    },
  });

  return data.map((row) => ({
    ...row,
    id: Number(row.id),
    min_hours_weekly: Number(row.min_hours_weekly ?? 0),
    min_hours_monthly: Number(row.min_hours_monthly ?? 0),
    penalty_per_hour: Number(row.penalty_per_hour ?? 0),
    bonus_per_hour: Number(row.bonus_per_hour ?? 0),
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    profile: row.profiles,
  })) as unknown as ProfileWorkConfigsPopulateProfile[];
}
