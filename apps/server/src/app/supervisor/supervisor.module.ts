import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import {
  ATTENDANCE_CONTROLLER,
  SUPERVISOR_CONTROLLER,
} from './registry/controller';
import {
  ATTENDANCE_SERVICES,
  BULL_MQ_SUMMARY_SESSION,
  MIX_SUPERVISOR_HELPER,
  MIX_SUPERVISOR_SERVICES,
  PROFILE_LISTENER,
} from './registry/providers';
import { BullModule } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Module({
  imports: [
    ActivitiesModule,
    BullModule.registerQueue({
      name: QUERY_NAME.SUMMARY_SESSION,
    }),
  ],
  controllers: [...SUPERVISOR_CONTROLLER, ...ATTENDANCE_CONTROLLER],
  providers: [
    ...MIX_SUPERVISOR_SERVICES,
    ...MIX_SUPERVISOR_HELPER,
    ...BULL_MQ_SUMMARY_SESSION,

    ...ATTENDANCE_SERVICES,

    ...PROFILE_LISTENER,
  ],
})
export class SupervisorModule {}
