import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { differenceInMinutes } from 'date-fns';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  endSessionById,
  getActiveSessions,
  getLastUserActivity,
} from 'src/helpers/work-session/cron/autoEndSessions.helper';

@Injectable()
export class WorkSessionCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndStopSession() {
    // Step 1: Ambil semua sesi aktif
    const activeSessions = await getActiveSessions(this.prisma);

    for (const session of activeSessions) {
      // Step 2: Ambil aktivitas terakhir user
      const lastActivity = await getLastUserActivity(
        this.prisma,
        session.user_id,
        session.start_at,
      );
      const referenceTime = lastActivity ?? new Date(session.start_at);

      const diff = differenceInMinutes(new Date(), referenceTime);
      if (diff <= 15) continue;

      // Step 3: Akhiri sesi jika inaktif > 15 menit
      await endSessionById(this.prisma, session.id, referenceTime, 'auto');
    }
  }
}
