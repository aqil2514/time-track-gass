import { Global, Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
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
import { SummarySessionProcessor } from './processor/summary-session.processor';
import { SummarySessionProcessorHelper } from './processor/helpers/summary-session.helper';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { ActivitiesV2Controller } from './controllers/activities-v2.controller';
import { ActivitiesSummaryTimeService } from './services/helpers/activities-summary-time.service';
import { ActivitiesWorkSession } from './services/helpers/activities-work-session.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: QUERY_NAME.DAILY_SUMMARY,
    }),
    BullModule.registerQueue({
      name: QUERY_NAME.DAILY_CATEGORY,
    }),
    BullModule.registerQueue({
      name: QUERY_NAME.SUMMARY_SESSION,
    }),

    HttpModule,
  ],
  controllers: [ActivitiesController, ActivitiesV2Controller],
  providers: [
    ActivitiesService,
    ActivitiesCronService,

    // Helper
    ActivitiesDailySummaryCronHelper,
    ActivitiesSessionSummaryCronHelper,
    ActivitiesFetcherHelper,
    ActivitiesDailySummaryPerCategoryCronHelper,
    ActivitiesCronMessageHelper,
    ActivitiesSummaryTimeService,
    ActivitiesWorkSession,

    // Processor
    DailySummaryProcessor,
    DailySummaryCategoryProcessor,
    SummarySessionProcessor,

    // Processor Helper
    SummarySessionProcessorHelper,
  ],
  exports: [ActivitiesCronService],
})
export class ActivitiesModule {}
