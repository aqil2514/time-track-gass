import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfileWorkConfigsDb } from 'src/app/supervisor/interfaces/attendances/profile-work-configs.interface';

export async function getUserWorkConfig(
  prisma: PrismaService,
): Promise<ProfileWorkConfigsDb[]> {
  const data = await prisma.profile_work_configs.findMany();

  return data.map((row) => ({
    id: Number(row.id),
    profile_id: row.profile_id,
    min_hours_weekly: Number(row.min_hours_weekly ?? 0),
    min_hours_monthly: Number(row.min_hours_monthly ?? 0),
    penalty_per_hour: Number(row.penalty_per_hour ?? 0),
    bonus_per_hour: Number(row.bonus_per_hour ?? 0),
    penalty_type: row.penalty_type,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
  })) as ProfileWorkConfigsDb[];
}
