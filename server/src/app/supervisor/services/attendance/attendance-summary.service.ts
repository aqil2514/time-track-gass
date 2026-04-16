import { Injectable } from '@nestjs/common';
import { AttendanceSummaryHelper } from './helpers/attendance-summary-helper.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { AttendanceSummaryMapper } from './helpers/attedance-summary-mapper.service';
import { AttendanceLogsRpc } from '../../interfaces/attendances/attendances-logs.interface';

@Injectable()
export class AttendanceSummaryService {
  constructor(
    private readonly helper: AttendanceSummaryHelper,
    private readonly mapper: AttendanceSummaryMapper,
  ) {}

  async getAttendanceSummary(query: AttendanceLogsQueryDto) {
    const [dbData, userConfig, adjustmentData] = await Promise.all([
      this.helper.getAttendanceSummaryByDateRange(query.start, query.end),
      this.helper.getUserConfigData(),
      this.helper.getAttendanceAdjustmentByDateRange(query.start, query.end),
    ]);

    let todayData = undefined;
    if (query.isIncludeToday) {
      todayData = await this.helper.getAttendanceSummaryToday();
    }

    const mappedData = await this.mapper.mapToSummaryData(
      query,
      dbData,
      userConfig,
      adjustmentData,
      todayData,
    );

    return mappedData;
  }

  async getAttendanceSummaryDetail(
    query: AttendanceLogsQueryDto,
    userId: string,
  ) {
    const [userAttendanceList, workHourHistory, profile] = await Promise.all([
      this.helper.getAttendanceAdjustmentByUserId(
        query.start,
        query.end,
        userId,
      ),
      this.helper.getAttendanceSummaryByDateRangeAndUserId(
        query.start,
        query.end,
        userId,
      ),
      this.helper.getUserProfile(userId),
    ]);

    let todayData: AttendanceLogsRpc[] = [];
    if (query.isIncludeToday) {
      todayData = await this.helper.getAttendanceSummaryToday();
    }

    const todayHistory = todayData
      .filter((item) => item.user_id === userId)
      .map((item) => ({
        id: Date.now(),
        work_date: item.date,
        duration_minutes: item.total_work_time,
      }));

    const mergedHistory = [...workHourHistory, ...todayHistory];

    return {
      listNotes: userAttendanceList,
      workHourHistory: mergedHistory,
      profile,
    };
  }
}
