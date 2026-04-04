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

@Module({
  imports: [ActivitiesModule],
  controllers: [
    SupervisorController,
    SupervisorUserController,
    SupervisorTrackerController,
    SupervisorDivisionsController
  ],
  providers: [
    SupervisorService,
    SupervisorUserService,
    SupervisorTrackerService,
    SupervisorDivisionsService,

    // Helper
    SupervisorUserHelper,
    SupervisorMatrixService,
    SupervisorActivityFetcher,
    SupervisorActivityMapper,
    SupervisorDivisionHelperService
  ],
})
export class SupervisorModule {}
