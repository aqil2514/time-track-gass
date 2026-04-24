import { Module } from '@nestjs/common';
import { WorkSessionController } from './work-session.controller';
import { WorkSessionService } from './work-session.service';
import { WorkSessionCronService } from './work-session-cron.service';

@Module({
  controllers: [WorkSessionController],
  providers: [WorkSessionService, WorkSessionCronService],
})
export class WorkSessionModule {}
