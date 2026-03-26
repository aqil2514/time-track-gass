import { Module } from '@nestjs/common';
import { SupervisorController } from './controllers/supervisor.controller';
import { SupervisorService } from './services/supervisor.service';
import { SupervisorActivityFetcher } from './services/helpers/supervisor-activity-fetcher.service';
import { ActivitiesModule } from '../activities/activities.module';
import { SupervisorUserController } from './controllers/supervisor-user.controller';
import { SupervisorUserService } from './services/supervisor-user.service';
import { SupervisorTrackerController } from './controllers/supervisor-tracker.controller';
import { SupervisorTrackerService } from './services/supervisor-tracker.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [
    SupervisorController,
    SupervisorUserController,
    SupervisorTrackerController,
  ],
  providers: [
    SupervisorService,
    SupervisorActivityFetcher,
    SupervisorUserService,
    SupervisorTrackerService
  ],
})
export class SupervisorModule {}
