import { Module } from '@nestjs/common';
import { SupervisorController } from './controllers/supervisor.controller';
import { SupervisorService } from './services/supervisor.service';
import { SupervisorActivityFetcher } from './services/helpers/supervisor-activity-fetcher.service';
import { ActivitiesModule } from '../activities/activities.module';
import { SupervisorUserController } from './controllers/supervisor-user.controller';
import { SupervisorUserService } from './services/supervisor-user.service';
import { SupervisorTrackerController } from './controllers/supervisor-tracker.controller';
import { SupervisorTrackerService } from './services/supervisor-tracker.service';
import { SupervisorActivityMapper } from './services/helpers/supervisor-activity-mapper.service';
import { SupervisorMatrixService } from './services/helpers/supervisor-matrix.service';
import { SupervisorDivisionsController } from './controllers/supervisor-divisions.controller';
import { SupervisorDivisionsService } from './services/supervisor-division.service';
import { SupervisorDivisionHelperService } from './services/helpers/supervisor-division-helper.service';
import { SupervisorUserHelper } from './services/helpers/supervisor-user-helper.service';
import { SupervisorActivityController } from './controllers/supervisor-activity.controller';
import { SupervisorACtivityService } from './services/supervisor-activity.service';
import { SupervisorAttendanceListNoteController } from './controllers/attendance/attendance-listnote.controller';
import { AttendanceListnoteService } from './services/attendance/attendance-listnote.service';
import { AttendanceProfileConfigController } from './controllers/attendance/attendance-profile-config.controller';
import { AttendanceProfileConfigService } from './services/attendance/attendance-profile-config.service';
import { ProfileListenerEvent } from './listeners/profile.listener';
import { ProfileListenerHelper } from './listeners/helpers/profile.listener-helper';

@Module({
  imports: [ActivitiesModule],
  controllers: [
    SupervisorController,
    SupervisorUserController,
    SupervisorTrackerController,
    SupervisorDivisionsController,
    SupervisorActivityController,

    // Attendance
    SupervisorAttendanceListNoteController,
    AttendanceProfileConfigController,
  ],
  providers: [
    // Services
    SupervisorService,
    SupervisorUserService,
    SupervisorTrackerService,
    SupervisorDivisionsService,
    SupervisorACtivityService,

    // Helper
    SupervisorUserHelper,
    SupervisorMatrixService,
    SupervisorActivityFetcher,
    SupervisorActivityMapper,
    SupervisorDivisionHelperService,

    // Attendance
    AttendanceListnoteService,
    AttendanceProfileConfigService,

    // Listeners
    ProfileListenerEvent,

    // Listener Helpers
    ProfileListenerHelper,

  ],
})
export class SupervisorModule {}
