import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getSummaryByDateRangeAndUser(
  prisma: PrismaService,
  startDate: string,
  endDate: string,
  userId: string,
) {
  const data = await prisma.attendance_logs.findMany({
    where: {
      work_date: { gte: new Date(startDate), lte: new Date(endDate) },
      profile_id: userId,
    },
    select: { id: true, work_date: true, duration_minutes: true },
    orderBy: { work_date: 'asc' },
  });

  return data.map((row) => ({
    id: Number(row.id),
    work_date: (row.work_date as any)?.toISOString?.() ?? row.work_date,
    duration_minutes: Number(row.duration_minutes ?? 0),
  }));
}
