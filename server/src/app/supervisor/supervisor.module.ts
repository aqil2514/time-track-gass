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

@Module({
  imports: [ActivitiesModule],
  controllers: [
    SupervisorController,
    SupervisorUserController,
    SupervisorTrackerController,
  ],
  providers: [
    SupervisorService,
    SupervisorUserService,
    SupervisorTrackerService,

    // Helper
    SupervisorMatrixService,
    SupervisorActivityFetcher,
    SupervisorActivityMapper,
  ],
})
export class SupervisorModule {}
