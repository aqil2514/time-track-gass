import { AttendanceLogsQueryDto } from 'src/app/supervisor/_dto/attendance/attendance-logs-query.dto';
import { ActivityAdjusmentsDb } from 'src/app/supervisor/_interfaces/attendances/activity-adjusments.interface';
import {
  AttendanceLogsDbPopulatedProfile,
  AttendanceLogsRpc,
  AttendanceSummary,
} from 'src/app/supervisor/_interfaces/attendances/attendances-logs.interface';
import { ProfileWorkConfigsDb } from 'src/app/supervisor/_interfaces/attendances/profile-work-configs.interface';

function mapFromDb(
  summaryMap: Map<string, AttendanceSummary>,
  dbData: AttendanceLogsDbPopulatedProfile[],
) {
  for (const data of dbData) {
    const exist = summaryMap.get(data.profile.id);
    if (exist) {
      exist.totalWorkTime += Number(data.duration_minutes);
    } else {
      summaryMap.set(data.profile.id, {
        id: data.profile.id,
        totalWorkTime: Number(data.duration_minutes),
        division: data.profile.division,
        fullName: data.profile.full_name,
      } as AttendanceSummary);
    }
  }
}

function mapFromToday(
  summaryMap: Map<string, AttendanceSummary>,
  dbData: AttendanceLogsDbPopulatedProfile[],
  todayData: AttendanceLogsRpc[],
) {
  for (const data of todayData) {
    const existing = summaryMap.get(data.user_id);
    if (existing) {
      existing.totalWorkTime += Number(data.total_work_time);
    } else {
      const profile = dbData.find((db) => db.profile.id === data.user_id)?.profile;
      summaryMap.set(data.user_id, {
        id: data.user_id,
        totalWorkTime: Number(data.total_work_time),
        division: profile?.division || data.division,
        fullName: profile?.full_name || data.full_name,
      } as AttendanceSummary);
    }
  }
}

function mapFromAdjustment(
  summaryMap: Map<string, AttendanceSummary>,
  adjustmentData: ActivityAdjusmentsDb[],
) {
  for (const adj of adjustmentData) {
    const existing = summaryMap.get(adj.profile_id);
    if (existing) {
      existing.totalWorkTime += Number(adj.affected_minutes);
    }
  }
}

function mapUpdateLabel(
  summaryMap: Map<string, AttendanceSummary>,
  query: AttendanceLogsQueryDto,
) {
  const periodLabel =
    query.mode === 'weekly'
      ? `Mingguan: ${query.start} s/d ${query.end}`
      : `Bulanan: ${query.month}/${query.year}`;

  summaryMap.forEach((item) => {
    item.period = periodLabel;
  });
}

function mapUpdateStatus(
  summaryMap: Map<string, AttendanceSummary>,
  userConfig: ProfileWorkConfigsDb[],
  query: AttendanceLogsQueryDto,
) {
  const configMap = new Map(userConfig.map((c) => [c.profile_id, c]));

  summaryMap.forEach((item, userId) => {
    const config = configMap.get(userId);
    if (!config) { item.status = 'Incomplete'; item.targetMinutes = 0; item.diffMinutes = 0; item.isOngoing = false; return; }

    const targetInMinutes =
      (query.mode === 'weekly' ? config.min_hours_weekly : config.min_hours_monthly) * 60;

    item.targetMinutes = targetInMinutes;
    item.diffMinutes = item.totalWorkTime - targetInMinutes;
    item.isOngoing = query.isIncludeToday;

    if (item.totalWorkTime >= targetInMinutes) {
      item.status = 'Complete';
    } else if (query.isIncludeToday) {
      item.status = 'Process';
    } else {
      item.status = 'Incomplete';
    }
  });
}

function mapUpdatePenalty(
  summaryMap: Map<string, AttendanceSummary>,
  userConfig: ProfileWorkConfigsDb[],
  query: AttendanceLogsQueryDto,
) {
  const configMap = new Map(userConfig.map((c) => [c.profile_id, c]));

  summaryMap.forEach((item, userId) => {
    const config = configMap.get(userId);
    if (!config) { item.penalty = '-'; return; }

    const targetMinutes =
      (query.mode === 'weekly' ? config.min_hours_weekly : config.min_hours_monthly) * 60;
    const diffInMinutes = targetMinutes - item.totalWorkTime;

    if (diffInMinutes <= 0) { item.penalty = '-'; return; }

    if (config.penalty_type === 'daily-sync') {
      item.penalty = query.isIncludeToday ? 'Sedang Diproses' : 'Daily Sync';
    } else if (config.penalty_type === 'fee') {
      const totalFee = Math.ceil(diffInMinutes / 60) * config.penalty_per_hour;
      item.penalty = query.isIncludeToday
        ? 'Sedang Diproses'
        : `Rp ${totalFee.toLocaleString('id-ID')}`;
    }
  });
}

export function mapToSummaryData(
  query: AttendanceLogsQueryDto,
  dbData: AttendanceLogsDbPopulatedProfile[],
  userConfig: ProfileWorkConfigsDb[],
  adjustmentData: ActivityAdjusmentsDb[],
  todayData?: AttendanceLogsRpc[],
): AttendanceSummary[] {
  const summaryMap = new Map<string, AttendanceSummary>();

  mapFromDb(summaryMap, dbData);
  if (todayData) mapFromToday(summaryMap, dbData, todayData);
  mapFromAdjustment(summaryMap, adjustmentData);
  mapUpdateLabel(summaryMap, query);
  mapUpdateStatus(summaryMap, userConfig, query);
  mapUpdatePenalty(summaryMap, userConfig, query);

  return Array.from(summaryMap.values());
}
