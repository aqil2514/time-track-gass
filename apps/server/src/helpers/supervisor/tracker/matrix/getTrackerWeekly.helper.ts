import { PrismaService } from 'src/services/prisma/prisma.service';
import { TotalWeeklyActivity } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function getTrackerWeekly(
  prisma: PrismaService,
  date: string,
): Promise<TotalWeeklyActivity[]> {
  // client_date converted to WIB (+07:00) before passing to truncate week
  const localDate = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
  const dayOfWeek = localDate.getUTCDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const endOfWeekDate = new Date(localDate);
  endOfWeekDate.setUTCDate(localDate.getUTCDate() + daysUntilSunday);
  const endDateOnly = endOfWeekDate.toISOString().split('T')[0];
  const clientDate = new Date(`${endDateOnly}T23:59:59+07:00`);

  const result = await prisma.$queryRaw<TotalWeeklyActivity[]>`
    SELECT
      report.user_id,
      SUM(report."interval")::BIGINT AS total_minutes,
      COUNT(*) AS total_activity
    FROM ai_screen_report report
    WHERE
      report.created_at >= DATE_TRUNC('week', ${clientDate} AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'
      AND report.created_at <= ${clientDate}
      AND report.category NOT IN ('unclassified', 'idle')
    GROUP BY report.user_id
  `;

  return result.map((row) => ({
    user_id: row.user_id,
    total_minutes: Number(row.total_minutes),
    total_activity: Number(row.total_activity),
  }));
}
