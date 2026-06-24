import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  DailySummaryResponse,
  WeeklySummaryResponse,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { parseISO, startOfWeek, endOfWeek, format } from 'date-fns';
import { TIMEZONE } from 'src/constants/timezone';

export async function getDailySummaryTime(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<DailySummaryResponse> {
  const formattedDate = formatInTimeZone(
    parseISO(date),
    TIMEZONE,
    'yyyy-MM-dd',
  );

  const data = await prisma.$queryRaw<DailySummaryResponse[]>`
    SELECT
      asr.user_id,
      DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS report_date,
      COUNT(*) AS total_count,
      SUM(asr."interval") AS total_work_time_minutes
    FROM ai_screen_report asr
    WHERE
      asr.user_id = ${userId}::uuid
      AND DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') = ${formattedDate}::date
      AND asr.category NOT IN ('unclassified', 'idle')
      AND asr.deleted_at IS NULL
    GROUP BY asr.user_id, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta')
  `;

  const row = data?.[0];
  if (!row) return { total_work_time_minutes: 0 } as DailySummaryResponse;

  return {
    user_id: row.user_id,
    report_date: row.report_date,
    total_count: Number(row.total_count ?? 0),
    total_work_time_minutes: Number(row.total_work_time_minutes ?? 0),
  } as DailySummaryResponse;
}

export async function getWeeklySummaryTime(
  prisma: PrismaService,
  userId: string,
  date: string,
): Promise<WeeklySummaryResponse> {
  const formattedDate = formatInTimeZone(
    parseISO(date),
    TIMEZONE,
    'yyyy-MM-dd',
  );

  const data = await prisma.$queryRaw<WeeklySummaryResponse[]>`
    SELECT
      asr.user_id,
      date_trunc('week', ${formattedDate}::date)::date AS week_start,
      (date_trunc('week', ${formattedDate}::date)::date + 6) AS week_end,
      SUM(asr."interval") AS total_work_time_minutes
    FROM ai_screen_report asr
    WHERE
      asr.user_id = ${userId}::uuid
      AND DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') BETWEEN
        date_trunc('week', ${formattedDate}::date)::date
        AND (date_trunc('week', ${formattedDate}::date)::date + 6)
      AND asr.category NOT IN ('unclassified', 'idle')
      AND asr.deleted_at IS NULL
    GROUP BY asr.user_id
  `;

  const row = data?.[0];
  if (!row) return { user_id: userId, total_work_time_minutes: 0, week_start: null, week_end: null } as WeeklySummaryResponse;

  return {
    user_id: row.user_id,
    week_start: row.week_start,
    week_end: row.week_end,
    total_work_time_minutes: Number(row.total_work_time_minutes ?? 0),
  } as WeeklySummaryResponse;
}

export async function getActivityAdjustment(
  prisma: PrismaService,
  userId: string,
  date: string,
) {
  const zonedDate = toZonedTime(parseISO(date), TIMEZONE);
  const monday = startOfWeek(zonedDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(zonedDate, { weekStartsOn: 1 });

  const startDate = format(monday, 'yyyy-MM-dd');
  const endDate = format(sunday, 'yyyy-MM-dd');

  const rows = await prisma.activity_adjustments.findMany({
    where: {
      profile_id: userId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    select: {
      affected_minutes: true,
      date: true,
      activity_adjustment_lists: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    affected_minutes: Number(row.affected_minutes),
    date: (row.date as any)?.toISOString?.() ?? row.date,
    activity_adjustment_lists: row.activity_adjustment_lists,
  }));
}
