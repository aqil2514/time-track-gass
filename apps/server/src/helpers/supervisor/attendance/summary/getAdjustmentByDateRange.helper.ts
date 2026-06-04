import { PrismaService } from 'src/services/prisma/prisma.service';
import { ActivityAdjusmentsDb } from 'src/app/supervisor/_interfaces/attendances/activity-adjusments.interface';

export async function getAdjustmentByDateRange(
  prisma: PrismaService,
  startDate: string,
  endDate: string,
): Promise<ActivityAdjusmentsDb[]> {
  const data = await prisma.activity_adjustments.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
  });

  return data.map((row) => ({
    id: Number(row.id),
    adjusment_id: Number(row.adjusment_id ?? 0),
    profile_id: row.profile_id,
    affected_minutes: Number(row.affected_minutes ?? 0),
    s3_key: row.s3_key,
    date: (row.date as any)?.toISOString?.() ?? row.date,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
  })) as unknown as ActivityAdjusmentsDb[];
}
