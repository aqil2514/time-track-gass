import { PrismaService } from 'src/services/prisma/prisma.service';
import { DailySummaryDb } from 'src/app/activities/interface/daily_summary.interface';
import { startOfDay, endOfDay } from 'date-fns';

export async function getDailyActivity(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<DailySummaryDb | undefined> {
  const start = startOfDay(new Date(date));
  const end = endOfDay(new Date(date));

  const row = await prisma.daily_summary.findFirst({
    where: {
      user_id: userId,
      date: { gte: start, lte: end },
    },
  });

  if (!row) return undefined;

  return row as unknown as DailySummaryDb;
}
