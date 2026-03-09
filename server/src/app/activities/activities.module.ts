import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesCronService } from './services/activities-cron.service';
import { ActivitiesSessionSummaryCronHelper } from './services/helpers/activites-cron-session-summary-helper.service';
import { ActivitiesFetcherHelper } from './services/helpers/activities-fetcher-helper.service';
import { ActivitiesDailySummaryCronHelper } from './services/helpers/activites-cron-daily-summary-helper.service';

@Module({
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesCronService,

    // Helper
    ActivitiesDailySummaryCronHelper,
    ActivitiesSessionSummaryCronHelper,
    ActivitiesFetcherHelper,
  ],
  exports: [ActivitiesCronService],
})
export class ActivitiesModule {}
