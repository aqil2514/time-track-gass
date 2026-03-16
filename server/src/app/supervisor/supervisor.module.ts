import { Module } from '@nestjs/common';
import { SupervisorController } from './controllers/supervisor.controller';
import { SupervisorService } from './services/supervisor.service';
import { SupervisorActivityFetcher } from './services/helpers/supervisor-activity-fetcher.service';
import { ActivitiesModule } from '../activities/activities.module';
import { SupervisorUserController } from './controllers/supervisor-user.controller';
import { SupervisorUserService } from './services/supervisor-user.service';

@Module({
  imports:[ActivitiesModule],
  controllers: [SupervisorController, SupervisorUserController],
  providers: [SupervisorService, SupervisorActivityFetcher, SupervisorUserService],
})
export class SupervisorModule {}