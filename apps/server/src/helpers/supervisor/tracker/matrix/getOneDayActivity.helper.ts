import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportPopulateUser } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function getOneDayActivity(
  prisma: PrismaService,
  userIds: string[],
  date: string,
): Promise<AIScreenReportPopulateUser[]> {
  const dateOnly = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const start = new Date(`${dateOnly}T00:00:00+07:00`);
  const end = new Date(`${dateOnly}T23:59:59+07:00`);

  const BATCH_SIZE = 500;
  let skip = 0;
  const finalData: AIScreenReportPopulateUser[] = [];

  while (true) {
    const batch = await prisma.ai_screen_report.findMany({
      where: {
        user_id: { in: userIds },
        created_at: { gte: start, lte: end },
        deleted_at: null,
        NOT: { category: 'unclassified' },
      },
      select: {
        id: true,
        created_at: true,
        app_name: true,
        window_title: true,
        category: true,
        summary: true,
        s3_key: true,
        interval: true,
        profiles: {
          select: {
            id: true,
            role: true,
            email: true,
            division: true,
            username: true,
            full_name: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
      take: BATCH_SIZE,
      skip,
    });

    if (batch.length === 0) break;

    finalData.push(
      ...batch.map(({ profiles, ...rest }) => ({
        ...rest,
        created_at: (rest.created_at as any)?.toISOString?.() ?? rest.created_at,
        interval: Number(rest.interval ?? 0),
        user: profiles,
      })) as unknown as AIScreenReportPopulateUser[],
    );

    if (batch.length < BATCH_SIZE) break;
    skip += BATCH_SIZE;
  }

  return finalData;
}
