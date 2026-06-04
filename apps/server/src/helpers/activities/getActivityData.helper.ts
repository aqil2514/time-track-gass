import { PrismaService } from 'src/services/prisma/prisma.service';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function getSessionSummaries(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<SessionSummaryDb[]> {
  const start = new Date(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = await prisma.session_summary.findMany({
    where: {
      user_id: userId,
      session_start: { gte: start, lt: end },
    },
    orderBy: { session_start: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    session_start: (row.session_start as any)?.toISOString?.() ?? row.session_start,
    session_end: (row.session_end as any)?.toISOString?.() ?? row.session_end,
    title: row.title,
    description: row.description,
    categories: row.categories,
    raw_ids: row.raw_ids as string[],
  })) as SessionSummaryDb[];
}

export async function getAiReportsByIds(
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
  })) as AIScreenReportDb[];
}

export function mapToActivityData(
  allReports: AIScreenReportDb[],
  summariesData: SessionSummaryDb[],
): ActivityData[] {
  const reportMap = new Map(allReports.map((r) => [r.id, r]));

  return summariesData.map((summary) => {
    const { raw_ids, ...rest } = summary;
    return {
      ...rest,
      items: raw_ids.map((id) => reportMap.get(id)).filter(Boolean),
    };
  });
}
