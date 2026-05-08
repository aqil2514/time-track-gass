import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkSessionService } from './work-session.service';
import { differenceInMinutes } from 'date-fns';

@Injectable()
export class WorkSessionCronService {
  constructor(private readonly workSessionService: WorkSessionService) {}
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndStopSession() {
    const activeSessions = await this.workSessionService.getActiveSessions();

    for (const session of activeSessions) {
      const lastTimeUserActivity =
        await this.workSessionService.getLastUserActivity(
          session.user_id,
          session.start_at,
        );
      const referenceTime = lastTimeUserActivity ?? new Date(session.start_at);

      const diff = differenceInMinutes(new Date(), referenceTime);

      if (diff <= 15) continue;
      await this.workSessionService.endSessionById(
        session.id,
        referenceTime,
        'auto',
      );
    }
  }
}
