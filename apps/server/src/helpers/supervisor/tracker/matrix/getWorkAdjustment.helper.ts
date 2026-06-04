import { PrismaService } from 'src/services/prisma/prisma.service';
import { AdjustmentContent } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';
import { format, toZonedTime } from 'date-fns-tz';
import { startOfWeek, endOfWeek } from 'date-fns';
import { TIMEZONE } from 'src/constants/timezone';

export async function getWorkAdjustment(
  prisma: PrismaService,
  date: string,
): Promise<AdjustmentContent[]> {
  const zonedTime = toZonedTime(date, TIMEZONE);
  const monday = startOfWeek(zonedTime, { weekStartsOn: 1 });
  const sunday = endOfWeek(zonedTime, { weekStartsOn: 1 });

  const formattedMonday = format(monday, 'yyyy-MM-dd', { timeZone: TIMEZONE });
  const formattedSunday = format(sunday, 'yyyy-MM-dd', { timeZone: TIMEZONE });

  const data = await prisma.activity_adjustments.findMany({
    where: {
      date: {
        gte: new Date(formattedMonday),
        lte: new Date(formattedSunday),
      },
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
    date: (row.date as any)?.toISOString?.() ?? row.date,
    affected_minutes: Number(row.affected_minutes ?? 0),
    profile: row.profiles,
    adjustment: {
      id: Number(row.activity_adjustment_lists?.id),
      name: row.activity_adjustment_lists?.name ?? '',
      notes: row.activity_adjustment_lists?.notes ?? '',
    },
  })) as unknown as AdjustmentContent[];
}
