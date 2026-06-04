import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getAllUserProfiles } from 'src/helpers/supervisor/user-activity/getAllUserProfiles.helper';
import { getUserIdByUsername } from 'src/helpers/supervisor/user-activity/getUserIdByUsername.helper';
import { getSessionActivity } from 'src/helpers/supervisor/user-activity/getSessionActivity.helper';
import { getRawActivities } from 'src/helpers/supervisor/user-activity/getRawActivities.helper';
import { getDailyActivity } from 'src/helpers/supervisor/user-activity/getDailyActivity.helper';
import { getDailyActivityPerCategory } from 'src/helpers/supervisor/user-activity/getDailyActivityPerCategory.helper';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';

@Injectable()
export class SupervisorService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUserProfiles() {
    // Step 1: Ambil semua profil aktif
    return getAllUserProfiles(this.prisma);
  }

  async getActivityData(username: string, date: string): Promise<ActivityData[]> {
    // Step 1: Dapatkan userId dari username
    const userId = await getUserIdByUsername(this.prisma, username);

    // Step 2: Ambil session activity berdasarkan userId dan tanggal
    const summariesData = await getSessionActivity(this.prisma, userId, date);

    // Step 3: Kumpulkan semua raw_ids dari session
    const allRawIds = summariesData.flatMap((s) => s.raw_ids);

    // Step 4: Ambil raw activity berdasarkan raw_ids
    const allReports = await getRawActivities(this.prisma, allRawIds);

    // Step 5: Map ke ActivityData
    return mapToActivityData(allReports, summariesData);
  }

  async getDailyActivity(username: string, date: string) {
    // Step 1: Dapatkan userId dari username
    const userId = await getUserIdByUsername(this.prisma, username);

    // Step 2: Ambil daily activity
    return getDailyActivity(this.prisma, userId, date);
  }

  async getDailyActivityPerCategory(username: string, date: string) {
    // Step 1: Dapatkan userId dari username
    const userId = await getUserIdByUsername(this.prisma, username);

    // Step 2: Ambil daily activity per kategori
    return getDailyActivityPerCategory(this.prisma, userId, date);
  }
}

function mapToActivityData(
  allReports: AIScreenReportDb[],
  summariesData: SessionSummaryDb[],
): ActivityData[] {
  const reportMap = new Map(allReports.map((r) => [r.id, r]));

  return summariesData.map((summary) => {
    const { raw_ids, ...rest } = summary;
    return {
      ...rest,
      items: raw_ids.map((id) => reportMap.get(id)).filter(Boolean),
    };
  });
}
