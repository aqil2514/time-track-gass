import { PrismaService } from 'src/services/prisma/prisma.service';
import { DailySummaryPerCategory } from 'src/app/activities/interface/daily_summary_per_category.interface';
import { DateFilterDto } from 'src/shared/dto/date-filter.dto';
import { buildDateRange } from 'src/shared/helpers/build-date-range.helper';

export async function getDailyActivityPerCategory(
  prisma: PrismaService,
  userId: string,
  filter: DateFilterDto,
): Promise<DailySummaryPerCategory[]> {
  const { start, end } = buildDateRange(filter);

  const rows = await prisma.daily_summary_per_categories.findMany({
    where: {
      user_id: userId,
      date: { gte: start, lte: end },
    },
  });

  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    duration: r.duration ? Number(r.duration) : undefined,
    date: (r.date as any)?.toISOString?.() ?? r.date,
  })) as unknown as DailySummaryPerCategory[];
}
