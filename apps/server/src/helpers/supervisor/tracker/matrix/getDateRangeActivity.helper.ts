import { PrismaService } from 'src/services/prisma/prisma.service';

export interface DailyActivityRaw {
  user_id: string;
  date: string;
  total_activity: number;
  total_minutes: number;
}

export async function getDateRangeActivity(
  prisma: PrismaService,
  userIds: string[],
  from: string,
  to: string,
): Promise<DailyActivityRaw[]> {
  const fromDate = new Date(`${from.slice(0, 10)}T00:00:00+07:00`);
  const toDate = new Date(`${to.slice(0, 10)}T23:59:59+07:00`);

  const rows = await prisma.$queryRaw<
    { user_id: string; date: Date; total_activity: bigint; total_minutes: bigint }[]
  >`
    SELECT
      user_id,
      DATE(created_at AT TIME ZONE 'Asia/Jakarta') AS date,
      COUNT(*)::bigint AS total_activity,
      SUM(interval)::bigint AS total_minutes
    FROM ai_screen_report
    WHERE
      user_id = ANY(${userIds}::uuid[])
      AND created_at >= ${fromDate}
      AND created_at <= ${toDate}
      AND deleted_at IS NULL
      AND category NOT IN ('unclassified', 'idle')
    GROUP BY user_id, DATE(created_at AT TIME ZONE 'Asia/Jakarta')
    ORDER BY user_id, date ASC
  `;

  return rows.map((row) => ({
    user_id: row.user_id,
    date: row.date.toISOString().slice(0, 10),
    total_activity: Number(row.total_activity),
    total_minutes: Number(row.total_minutes),
  }));
}
