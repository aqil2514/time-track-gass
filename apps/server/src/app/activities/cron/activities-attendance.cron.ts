import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  buildAttendancePayload,
  getYesterdayScreenReports,
  upsertAttendanceLogs,
} from 'src/helpers/activities/cron/createNewTotalWorkTime.helper';

@Injectable()
export class ActivitiesAttendanceCronService {
  private readonly logger = new Logger(ActivitiesAttendanceCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    timeZone: 'Asia/Jakarta',
  })
  async createNewTotalWorkTime() {
    // Step 1: Ambil data screen report kemarin
    const dbData = await getYesterdayScreenReports(this.prisma);

    if (!dbData || dbData.length === 0) {
      this.logger.warn('Tidak ada data kerja untuk kemarin.');
      return;
    }

    // Step 2: Build payload attendance logs
    const payload = buildAttendancePayload(dbData);

    // Step 3: Upsert ke attendance_logs
    await upsertAttendanceLogs(this.prisma, payload);

    this.logger.log(`Berhasil memindahkan ${payload.length} data kerja.`);
  }
}
