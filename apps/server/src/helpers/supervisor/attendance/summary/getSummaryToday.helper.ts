import { PrismaService } from 'src/services/prisma/prisma.service';
import { AttendanceLogsRpc } from 'src/app/supervisor/_interfaces/attendances/attendances-logs.interface';

export async function getSummaryToday(
  prisma: PrismaService,
): Promise<AttendanceLogsRpc[]> {
  const result = await prisma.$queryRaw<AttendanceLogsRpc[]>`
    SELECT
      p.id AS user_id,
      p.full_name,
      p.username,
      p.division,
      DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS date,
      COUNT(*) AS count,
      SUM(asr."interval") AS total_work_time
    FROM ai_screen_report asr
    JOIN profiles p ON p.id = asr.user_id
    WHERE
      DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE
      AND asr.category NOT IN ('unclassified', 'idle')
      AND p.deleted_at IS NULL
    GROUP BY p.id, p.full_name, p.username, p.division, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta')
  `;

  return result.map((row) => ({
    ...row,
    count: Number(row.count),
    total_work_time: Number(row.total_work_time),
  }));
}
