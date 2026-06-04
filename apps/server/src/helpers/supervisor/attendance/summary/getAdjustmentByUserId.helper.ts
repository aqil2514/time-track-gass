import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAdjustmentByUserId(
  prisma: PrismaService,
  startDate: string,
  endDate: string,
  userId: string,
) {
  const data = await prisma.activity_adjustments.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
      profile_id: userId,
    },
    select: {
      id: true,
      date: true,
      affected_minutes: true,
      activity_adjustment_lists: {
        select: { id: true, name: true, notes: true },
      },
    },
  });

  return data.map((row) => ({
    id: Number(row.id),
    date: (row.date as any)?.toISOString?.() ?? row.date,
    affected_minutes: Number(row.affected_minutes ?? 0),
    adjustment: {
      id: Number(row.activity_adjustment_lists?.id ?? 0),
      name: row.activity_adjustment_lists?.name ?? '',
      notes: row.activity_adjustment_lists?.notes ?? '',
    },
  }));
}
