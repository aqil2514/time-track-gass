import { format } from 'date-fns';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAdjustmentByDateRange(
  prisma: PrismaService,
  startDate: string,
  endDate: string,
) {
  const data = await prisma.activity_adjustments.findMany({
    where: {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    select: {
      id: true,
      date: true,
      affected_minutes: true,
      profiles: {
        select: { id: true, full_name: true, username: true, division: true },
      },
      activity_adjustment_lists: {
        select: { id: true, name: true, notes: true },
      },
    },
  });

  return data.map((row) => ({
    id: Number(row.id),
    date: row.date ? format(new Date(row.date as any), 'yyyy-MM-dd') : row.date,
    affected_minutes: Number(row.affected_minutes ?? 0),
    profile: row.profiles,
    adjustment: {
      id: Number(row.activity_adjustment_lists?.id ?? 0),
      name: row.activity_adjustment_lists?.name ?? '',
      notes: row.activity_adjustment_lists?.notes ?? '',
    },
  }));
}
