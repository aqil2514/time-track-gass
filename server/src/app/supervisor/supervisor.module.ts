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
  ],
  providers: [
    SupervisorService,
    SupervisorUserService,
    SupervisorTrackerService,
    SupervisorDivisionsService,
    SupervisorACtivityService,
    
    // Attendance
    AttendanceListnoteService,

    // Helper
    SupervisorUserHelper,
    SupervisorMatrixService,
    SupervisorActivityFetcher,
    SupervisorActivityMapper,
    SupervisorDivisionHelperService,
  ],
})
export class SupervisorModule {}
