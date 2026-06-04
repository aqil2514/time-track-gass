import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { SummarySessionProcessor } from '../activities/processor/summary-session.processor';
import { BullModule } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { DivisionsModule } from './divisions/divisions.module';
import { ActivityModule } from './activity/activity.module';
import { UserModule } from './user/user.module';
import { TrackerModule } from './tracker/tracker.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SupervisorController } from './supervisor.controller';
import { SupervisorService } from './supervisor.service';

@Module({
  imports: [
    ActivitiesModule,
    BullModule.registerQueue({
      name: QUERY_NAME.SUMMARY_SESSION,
    }),
    DivisionsModule,
    ActivityModule,
    UserModule,
    TrackerModule,
    AttendanceModule,
  ],
  controllers: [SupervisorController],
  providers: [SummarySessionProcessor, SupervisorService],
})
export class SupervisorModule {}
