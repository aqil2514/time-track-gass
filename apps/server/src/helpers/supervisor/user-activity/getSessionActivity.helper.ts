import { PrismaService } from 'src/services/prisma/prisma.service';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';

export async function getSessionActivity(
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
    ...row,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    session_start: (row.session_start as any)?.toISOString?.() ?? row.session_start,
    session_end: (row.session_end as any)?.toISOString?.() ?? row.session_end,
  })) as unknown as SessionSummaryDb[];
}
