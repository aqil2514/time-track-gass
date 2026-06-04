import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function getRawActivities(
  prisma: PrismaService,
  rawIds: string[],
): Promise<AIScreenReportDb[]> {
  const rows = await prisma.ai_screen_report.findMany({
    where: { id: { in: rawIds } },
    orderBy: { created_at: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    app_name: row.app_name,
    window_title: row.window_title,
    category: row.category,
    summary: row.summary,
    user_id: row.user_id,
    s3_key: row.s3_key,
    interval: Number(row.interval ?? 0),
  })) as unknown as AIScreenReportDb[];
}
