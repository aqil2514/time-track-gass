import { Injectable } from '@nestjs/common';
import { ActivityData } from '../interface/activities_data.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  getAiReportsByIds,
  getSessionSummaries,
  mapToActivityData,
} from 'src/helpers/activities/getActivityData.helper';
import {
  getActivityAdjustment,
  getDailySummaryTime,
  getWeeklySummaryTime,
} from 'src/helpers/activities/getTotalWork.helper';
import { getDailyActivity } from 'src/helpers/activities/getDailyActivity.helper';
import {
  getWorkReports,
  getWorkSessions,
  mapToWorkSessionReport,
} from 'src/helpers/activities/getWorkSession.helper';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivityData(userId: string, date: string): Promise<ActivityData[]> {
    // Step 1: Ambil session summaries berdasarkan tanggal
    const summaries = await getSessionSummaries(this.prisma, userId, date);
    // Step 2: Ambil raw AI reports berdasarkan raw_ids
    const allRawIds = summaries.flatMap((s) => s.raw_ids);
    const reports = await getAiReportsByIds(this.prisma, allRawIds);
    // Step 3: Map ke ActivityData
    return mapToActivityData(reports, summaries);
  }

  async getTotalWork(userId: string, date: string) {
    // Step 1: Ambil daily summary, weekly summary, dan activity adjustment secara paralel
    const [dailySummaryTime, weeklySummaryTime, activityAdjustment] =
      await Promise.all([
        getDailySummaryTime(this.prisma, userId, date),
        getWeeklySummaryTime(this.prisma, userId, date),
        getActivityAdjustment(this.prisma, userId, date),
      ]);

    return { dailySummaryTime, weeklySummaryTime, activityAdjustment };
  }

  async getDailyActivity(userId: string, date: string) {
    // Step 1: Ambil ringkasan harian berdasarkan tanggal
    return await getDailyActivity(this.prisma, userId, date);
  }

  async getWorkSession(userId: string, date: string) {
    // Step 1: Ambil work sessions dan reports secara paralel
    const [sessions, reports] = await Promise.all([
      getWorkSessions(this.prisma, userId, date),
      getWorkReports(this.prisma, userId, date),
    ]);
    // Step 2: Map reports ke dalam setiap sesi
    return mapToWorkSessionReport(sessions, reports);
  }

}
