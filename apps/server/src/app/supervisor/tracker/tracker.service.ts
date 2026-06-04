import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getTrackerActivity } from 'src/helpers/supervisor/tracker/getTrackerActivity.helper';
import { getTrackerById } from 'src/helpers/supervisor/tracker/getTrackerById.helper';
import { mapToImageUrl } from 'src/helpers/supervisor/tracker/mapToImageUrl.helper';
import { getActiveUsers } from 'src/helpers/supervisor/tracker/matrix/getActiveUsers.helper';
import { getOneDayActivity } from 'src/helpers/supervisor/tracker/matrix/getOneDayActivity.helper';
import { getTrackerWeekly } from 'src/helpers/supervisor/tracker/matrix/getTrackerWeekly.helper';
import { getWorkSession } from 'src/helpers/supervisor/tracker/matrix/getWorkSession.helper';
import { getWorkAdjustment } from 'src/helpers/supervisor/tracker/matrix/getWorkAdjustment.helper';
import { mapToMatrixData } from 'src/helpers/supervisor/tracker/matrix/mapToMatrixData.helper';

@Injectable()
export class TrackerService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('AWS_S3_CLIENT') private readonly s3Client: S3Client,
  ) {}

  async getTrackerActivityData(username: string, date: string) {
    // Step 1: Ambil aktivitas tracker berdasarkan username dan tanggal
    return getTrackerActivity(this.prisma, username, date);
  }

  async getTrackerByActivityId(activityId: string) {
    // Step 1: Ambil data aktivitas by ID
    const activityData = await getTrackerById(this.prisma, activityId);
    // Step 2: Map S3 key ke signed URL
    return mapToImageUrl(this.s3Client, activityData);
  }

  async getTrackerMatrix(date: string) {
    // Step 1: Ambil semua data secara paralel
    const [users, trackerWeekly, workSession, workAdjustment] =
      await Promise.all([
        getActiveUsers(this.prisma),
        getTrackerWeekly(this.prisma, date),
        getWorkSession(this.prisma, date),
        getWorkAdjustment(this.prisma, date),
      ]);
    // Step 2: Ambil aktivitas satu hari untuk semua user
    const userIds = users.map((u) => u.id);
    const rawData = await getOneDayActivity(this.prisma, userIds, date);
    // Step 3: Map ke format matrix
    return mapToMatrixData(rawData, users, trackerWeekly, workSession, workAdjustment);
  }
}
