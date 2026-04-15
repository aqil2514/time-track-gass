import { Injectable } from '@nestjs/common';
import { AttendanceSummaryHelper } from './helpers/attendance-summary-helper.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { AttendanceSummaryMapper } from './helpers/attedance-summary-mapper.service';

@Injectable()
export class AttendanceSummaryService {
  constructor(
    private readonly helper: AttendanceSummaryHelper,
    private readonly mapper: AttendanceSummaryMapper,
  ) {}

  async getAttendanceSummary(query: AttendanceLogsQueryDto) {
    const [dbData, userConfg] = await Promise.all([
      this.helper.getAttendanceSummaryByDateRange(query.start, query.end),
      this.helper.getUserConfigData(),
    ]);

    let todayData = undefined;
    if (query.isIncludeToday) {
      todayData = await this.helper.getAttendanceSummaryToday();
    }

    const mappedData = await this.mapper.mapToSummaryData(
      query,
      dbData,
      userConfg,
      todayData,
    );

    return mappedData;
  }
}
