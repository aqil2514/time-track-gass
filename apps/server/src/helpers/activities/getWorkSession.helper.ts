import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  WorkSessionItem,
  WorkSessionReport,
} from 'src/app/activities/interface/work_session.interface';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from 'src/constants/timezone';

export async function getWorkSessions(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<Omit<WorkSessionItem, 'reports'>[]> {
  const zonedTime = toZonedTime(date, TIMEZONE);
  const start = startOfDay(zonedTime);
  const end = endOfDay(zonedTime);

  const data = await prisma.work_sessions.findMany({
    where: {
      user_id: userId,
      start_at: { gte: start, lt: end },
    },
    select: { id: true, start_at: true, end_at: true },
  });

  return data as unknown as Omit<WorkSessionItem, 'reports'>[];
}

export async function getWorkReports(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<WorkSessionReport[]> {
  const zonedTime = toZonedTime(date, TIMEZONE);
  const start = startOfDay(zonedTime);
  const end = endOfDay(zonedTime);

  const data = await prisma.ai_screen_report.findMany({
    where: {
      user_id: userId,
      created_at: { gte: start, lt: end },
    },
    select: {
      id: true,
      created_at: true,
      app_name: true,
      window_title: true,
      summary: true,
      category: true,
    },
  });

  return data as unknown as WorkSessionReport[];
}

export function mapToWorkSessionReport(
  sessions: Omit<WorkSessionItem, 'reports'>[],
  reports: WorkSessionReport[],
): WorkSessionItem[] {
  return sessions.map((session) => {
    const sessionStart = session.start_at;
    const sessionEnd = session.end_at || new Date().toISOString();

    const reportsInSession = reports.filter(
      (report) =>
        report.created_at >= sessionStart && report.created_at <= sessionEnd,
    );

    return {
      id: session.id,
      start_at: session.start_at,
      end_at: session.end_at,
      reports: reportsInSession,
    };
  });
}
