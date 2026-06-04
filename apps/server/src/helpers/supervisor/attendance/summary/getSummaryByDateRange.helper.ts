import { PrismaService } from 'src/services/prisma/prisma.service';
import { AttendanceLogsDbPopulatedProfile } from 'src/app/supervisor/interfaces/attendances/attendances-logs.interface';

export async function getSummaryByDateRange(
  prisma: PrismaService,
  startDate: string,
  endDate: string,
): Promise<AttendanceLogsDbPopulatedProfile[]> {
  const data = await prisma.attendance_logs.findMany({
    where: {
      work_date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: { profiles: true },
    orderBy: { work_date: 'asc' },
  });

  return data.map((row) => ({
    id: Number(row.id),
    work_date: (row.work_date as any)?.toISOString?.() ?? row.work_date,
    duration_minutes: Number(row.duration_minutes ?? 0),
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    profile: row.profiles as any,
  })) as unknown as AttendanceLogsDbPopulatedProfile[];
}
