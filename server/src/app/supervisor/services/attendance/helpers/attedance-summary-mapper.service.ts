import { Injectable } from '@nestjs/common';
import { AttendanceLogsQueryDto } from 'src/app/supervisor/dto/attendance/attendance-logs-query.dto';
import { ActivityAdjusmentsDb } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';
import {
  AttendanceLogsDbPopulatedProfile,
  AttendanceLogsRpc,
  AttendanceSummary,
} from 'src/app/supervisor/interfaces/attendances/attendances-logs.interface';
import { ProfileWorkConfigsDb } from 'src/app/supervisor/interfaces/attendances/profile-work-configs.interface';

@Injectable()
export class AttendanceSummaryMapper {
  constructor() { }

  private mapFromDb(
    summaryMap: Map<string, AttendanceSummary>,
    dbData: AttendanceLogsDbPopulatedProfile[],
  ): Map<string, AttendanceSummary> {
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
    return summaryMap;
  }

  private mapFromToday(
    summaryMap: Map<string, AttendanceSummary>,
    dbData: AttendanceLogsDbPopulatedProfile[],
    todayData: AttendanceLogsRpc[],
  ) {
    for (const data of todayData) {
      console.log(data)
      const existing = summaryMap.get(data.user_id);
      if (existing) {
        existing.totalWorkTime += Number(data.total_work_time);
      } else {
        const profile = dbData.find(
          (db) => db.profile.id === data.user_id,
        )?.profile;
        summaryMap.set(data.user_id, {
          id: data.user_id,
          totalWorkTime: Number(data.total_work_time),
          division: profile?.division || data.division,
          fullName: profile?.full_name || data.full_name,
        } as AttendanceSummary);
      }
    }
  }

  private mapFromAdjustment(
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

  private mapUpdateLabel(
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

  private mapUpdateStatus(
    summaryMap: Map<string, AttendanceSummary>,
    userConfig: ProfileWorkConfigsDb[],
    query: AttendanceLogsQueryDto,
  ) {
    const configMap = new Map(userConfig.map((c) => [c.profile_id, c]));

    summaryMap.forEach((item, userId) => {
      const config = configMap.get(userId);

      if (!config) {
        item.status = 'Incomplete';
        return;
      }

      let targetInHours = 0;
      if (query.mode === 'weekly') {
        targetInHours = config.min_hours_weekly ?? 0;
      } else if (query.mode === 'monthly') {
        targetInHours = config.min_hours_monthly ?? 0;
      }

      const targetInMinutes = targetInHours * 60;
      const isSafe = item.totalWorkTime >= targetInMinutes;

      if (isSafe) {
        item.status = 'Complete';
      } else if (query.isIncludeToday) {
        item.status = 'Process';
      } else {
        item.status = 'Incomplete';
      }
    });
  }

  private mapUpdatePenalty(
    summaryMap: Map<string, AttendanceSummary>,
    userConfig: ProfileWorkConfigsDb[],
    query: AttendanceLogsQueryDto,
  ) {
    const configMap = new Map(userConfig.map((c) => [c.profile_id, c]));

    summaryMap.forEach((item, userId) => {
      const config = configMap.get(userId);

      if (!config) {
        item.penalty = '-';
        return;
      }

      const targetHours =
        query.mode === 'weekly'
          ? config.min_hours_weekly
          : config.min_hours_monthly;

      const targetMinutes = targetHours * 60;
      const diffInMinutes = targetMinutes - item.totalWorkTime;

      const isPenalty = diffInMinutes > 0;

      if (isPenalty) {
        const penaltyType = config.penalty_type;

        if (penaltyType === 'daily-sync') {
          item.penalty = query.isIncludeToday
            ? 'Sedang Diproses'
            : 'Daily Sync';
        } else if (penaltyType === 'fee') {
          const hoursMissing = diffInMinutes / 60;
          const totalFee = Math.ceil(hoursMissing) * config.penalty_per_hour;
          item.penalty = query.isIncludeToday
            ? 'Sedang Diproses'
            : `Rp ${totalFee.toLocaleString('id-ID')}`;
        }
      } else {
        item.penalty = '-';
      }
    });
  }

  async mapToSummaryData(
    query: AttendanceLogsQueryDto,
    dbData: AttendanceLogsDbPopulatedProfile[],
    userConfig: ProfileWorkConfigsDb[],
    adjustmentData: ActivityAdjusmentsDb[],
    todayData?: AttendanceLogsRpc[],
  ) {
    const summaryMap = new Map<string, AttendanceSummary>();

    this.mapFromDb(summaryMap, dbData);
    if (todayData) {
      this.mapFromToday(summaryMap, dbData, todayData);
    }
    this.mapFromAdjustment(summaryMap, adjustmentData);
    this.mapUpdateLabel(summaryMap, query);
    this.mapUpdateStatus(summaryMap, userConfig, query);
    this.mapUpdatePenalty(summaryMap, userConfig, query);

    return Array.from(summaryMap.values());
  }
}
