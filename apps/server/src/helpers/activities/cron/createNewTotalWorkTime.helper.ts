import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  AttendanceLogsDbInsert,
  AttendanceLogsRpc,
} from 'src/app/supervisor/_interfaces/attendances/attendances-logs.interface';

export async function getYesterdayScreenReports(
  prisma: PrismaService,
): Promise<AttendanceLogsRpc[]> {
  return prisma.$queryRaw<AttendanceLogsRpc[]>`
    SELECT
      asr.user_id,
      DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS date,
      COUNT(*) AS count,
      SUM(asr."interval") AS total_work_time
    FROM ai_screen_report asr
    WHERE
      DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - 1
      AND asr.category NOT IN ('unclassified', 'idle')
    GROUP BY asr.user_id, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta')
  `;
}

export function buildAttendancePayload(
  dbData: AttendanceLogsRpc[],
): AttendanceLogsDbInsert[] {
  return dbData.map((d) => ({
    duration_minutes: Number(d.total_work_time),
    profile_id: d.user_id,
    work_date: d.date,
  }));
}

export async function upsertAttendanceLogs(
  prisma: PrismaService,
  payload: AttendanceLogsDbInsert[],
): Promise<void> {
  await Promise.all(
    payload.map((item) =>
      prisma.attendance_logs.upsert({
        where: {
          profile_id_work_date: {
            profile_id: item.profile_id,
            work_date: new Date(item.work_date),
          },
        },
        update: { duration_minutes: item.duration_minutes },
        create: {
          profile_id: item.profile_id,
          work_date: new Date(item.work_date),
          duration_minutes: item.duration_minutes,
        },
      }),
    ),
  );
}
