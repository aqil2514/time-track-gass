import { Global, Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesCronService } from './services/activities-cron.service';
import { ActivitiesSessionSummaryCronHelper } from './services/helpers/activites-cron-session-summary-helper.service';
import { ActivitiesFetcherHelper } from './services/helpers/activities-fetcher-helper.service';
import { ActivitiesDailySummaryCronHelper } from './services/helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesDailySummaryPerCategoryCronHelper } from './services/helpers/activities-cron-daily-summary-per-category.service';
import { BullModule } from '@nestjs/bullmq';
import { DailySummaryProcessor } from './processor/daily-summary.processor';
import { DailySummaryCategoryProcessor } from './processor/daily-summary-category.processor';
import { HttpModule } from '@nestjs/axios';
import { ActivitiesCronMessageHelper } from './services/helpers/activities-cron-message.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'daily-summary-queue',
    }),
    BullModule.registerQueue({
      name: 'daily-category-summary-queue',
    }),
    HttpModule,
  ],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesCronService,

    // Helper
    ActivitiesDailySummaryCronHelper,
    ActivitiesSessionSummaryCronHelper,
    ActivitiesFetcherHelper,
    ActivitiesDailySummaryPerCategoryCronHelper,
    ActivitiesCronMessageHelper,

    // Processor
    DailySummaryProcessor,
    DailySummaryCategoryProcessor,
  ],
  exports: [ActivitiesCronService],
})
export class ActivitiesModule {}
