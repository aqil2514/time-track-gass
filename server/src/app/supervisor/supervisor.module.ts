import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import {
  ATTENDANCE_CONTROLLER,
  SUPERVISOR_CONTROLLER,
} from './registry/controller';
import {
  ATTENDANCE_SERVICES,
  MIX_SUPERVISOR_HELPER,
  MIX_SUPERVISOR_SERVICES,
  PROFILE_LISTENER,
} from './registry/providers';

@Module({
  imports: [ActivitiesModule],
  controllers: [...SUPERVISOR_CONTROLLER, ...ATTENDANCE_CONTROLLER],
  providers: [
    ...MIX_SUPERVISOR_SERVICES,
    ...MIX_SUPERVISOR_HELPER,

    ...ATTENDANCE_SERVICES,

    ...PROFILE_LISTENER,
  ],
})
export class SupervisorModule {}
