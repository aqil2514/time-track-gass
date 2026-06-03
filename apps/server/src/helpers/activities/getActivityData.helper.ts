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

  const data = await prisma.session_summary.findMany({
    where: {
      user_id: userId,
      session_start: { gte: start, lt: end },
    },
    orderBy: { session_start: 'desc' },
  });

  return data as unknown as SessionSummaryDb[];
}

export async function getAiReportsByIds(
  prisma: PrismaService,
  rawIds: string[],
): Promise<AIScreenReportDb[]> {
  const data = await prisma.ai_screen_report.findMany({
    where: { id: { in: rawIds } },
    orderBy: { created_at: 'desc' },
  });

  return data as unknown as AIScreenReportDb[];
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
