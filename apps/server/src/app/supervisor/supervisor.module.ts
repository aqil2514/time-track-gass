import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { BULL_MQ_SUMMARY_SESSION, PROFILE_LISTENER } from './registry/providers';
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
  providers: [
    ...BULL_MQ_SUMMARY_SESSION,
    ...PROFILE_LISTENER,
    SupervisorService,
  ],
})
export class SupervisorModule {}
