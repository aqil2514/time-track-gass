import { Module } from '@nestjs/common';
import { SupervisorController } from './supervisor.controller';
import { SupervisorService } from './services/supervisor.service';
import { SupervisorActivityFetcher } from './services/helpers/supervisor-activity-fetcher.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports:[ActivitiesModule],
  controllers: [SupervisorController],
  providers: [SupervisorService, SupervisorActivityFetcher],
})
export class SupervisorModule {}