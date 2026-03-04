import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesCronService } from './services/activities-cron.service';
import { ActivitiesCronHelper } from './services/helpers/activites-cron-helper.service';
import { ActivitiesFetcherHelper } from './services/helpers/activities-fetcher-helper.service';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesCronService,
    ActivitiesCronHelper,
    ActivitiesFetcherHelper,
  ],
})
export class ActivitiesModule {}
