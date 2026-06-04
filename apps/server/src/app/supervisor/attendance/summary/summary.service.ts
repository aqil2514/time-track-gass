import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { AttendanceLogsRpc } from '../../interfaces/attendances/attendances-logs.interface';
import { getSummaryByDateRange } from 'src/helpers/supervisor/attendance/summary/getSummaryByDateRange.helper';
import { getSummaryByDateRangeAndUser } from 'src/helpers/supervisor/attendance/summary/getSummaryByDateRangeAndUser.helper';
import { getAdjustmentByDateRange } from 'src/helpers/supervisor/attendance/summary/getAdjustmentByDateRange.helper';
import { getAdjustmentByUserId } from 'src/helpers/supervisor/attendance/summary/getAdjustmentByUserId.helper';
import { getSummaryToday } from 'src/helpers/supervisor/attendance/summary/getSummaryToday.helper';
import { getUserWorkConfig } from 'src/helpers/supervisor/attendance/summary/getUserWorkConfig.helper';
import { getUserProfile } from 'src/helpers/supervisor/attendance/summary/getUserProfile.helper';
import { mapToSummaryData } from 'src/helpers/supervisor/attendance/summary/mapToSummaryData.helper';

@Injectable()
export class SummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(query: AttendanceLogsQueryDto) {
    // Step 1: Ambil data dari DB secara paralel
    const [dbData, userConfig, adjustmentData] = await Promise.all([
      getSummaryByDateRange(this.prisma, query.start, query.end),
      getUserWorkConfig(this.prisma),
      getAdjustmentByDateRange(this.prisma, query.start, query.end),
    ]);
    // Step 2: Ambil data hari ini jika diperlukan
    let todayData: AttendanceLogsRpc[] | undefined;
    if (query.isIncludeToday) {
      todayData = await getSummaryToday(this.prisma);
    }
    // Step 3: Map ke format summary
    return mapToSummaryData(query, dbData, userConfig, adjustmentData, todayData);
  }

  async getSummaryDetail(query: AttendanceLogsQueryDto, userId: string) {
    // Step 1: Ambil data detail secara paralel
    const [userAttendanceList, workHourHistory, profile] = await Promise.all([
      getAdjustmentByUserId(this.prisma, query.start, query.end, userId),
      getSummaryByDateRangeAndUser(this.prisma, query.start, query.end, userId),
      getUserProfile(this.prisma, userId),
    ]);
    // Step 2: Ambil data hari ini jika diperlukan
    let todayData: AttendanceLogsRpc[] = [];
    if (query.isIncludeToday) {
      todayData = await getSummaryToday(this.prisma);
    }
    // Step 3: Merge history dengan data hari ini
    const todayHistory = todayData
      .filter((item) => item.user_id === userId)
      .map((item) => ({
        id: Date.now(),
        work_date: item.date,
        duration_minutes: item.total_work_time,
      }));

    return {
      listNotes: userAttendanceList,
      workHourHistory: [...workHourHistory, ...todayHistory],
      profile,
    };
  }
}
