import { PrismaService } from 'src/services/prisma/prisma.service';
import { DailySummaryPerCategory } from 'src/app/activities/interface/daily_summary_per_category.interface';

export async function getDailyActivityPerCategory(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<DailySummaryPerCategory[]> {
  const formattedDate = new Date(date).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  const rows = await prisma.daily_summary_per_categories.findMany({
    where: {
      user_id: userId,
      date: new Date(formattedDate),
    },
  });

  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    duration: r.duration ? Number(r.duration) : undefined,
    date: formattedDate,
  })) as unknown as DailySummaryPerCategory[];
}
