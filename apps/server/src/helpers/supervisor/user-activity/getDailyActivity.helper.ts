import { PrismaService } from 'src/services/prisma/prisma.service';
import { DailySummaryDb } from 'src/app/activities/interface/daily_summary.interface';
import { DateFilterDto } from 'src/shared/dto/date-filter.dto';
import { buildDateRange } from 'src/shared/helpers/build-date-range.helper';

export async function getDailyActivity(
  prisma: PrismaService,
  userId: string,
  filter: DateFilterDto,
): Promise<DailySummaryDb | undefined> {
  const { start, end } = buildDateRange(filter);

  const row = await prisma.daily_summary.findFirst({
    where: {
      user_id: userId,
      date: { gte: start, lte: end },
    },
  });

  if (!row) return undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    date: (row.date as any)?.toISOString?.() ?? row.date,
    summary: row.summary,
    highlights: row.highlights as string[],
    productivity_description: row.productivity_description,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
  } as DailySummaryDb;
}
