import { Global, Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesReminderCronService } from './cron/activities-reminder.cron';
import { ActivitiesAttendanceCronService } from './cron/activities-attendance.cron';
import { ActivitiesSummaryCronService } from './cron/activities-summary.cron';
import { BullModule } from '@nestjs/bullmq';
import { DailySummaryProcessor } from './processor/daily-summary.processor';
import { DailySummaryCategoryProcessor } from './processor/daily-summary-category.processor';
import { HttpModule } from '@nestjs/axios';
import { SummarySessionProcessor } from './processor/summary-session.processor';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { ActivitiesV2Controller } from './controllers/activities-v2.controller';

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
    ActivitiesReminderCronService,
    ActivitiesAttendanceCronService,
    ActivitiesSummaryCronService,

    // Processor
    DailySummaryProcessor,
    DailySummaryCategoryProcessor,
    SummarySessionProcessor,
  ],
  exports: [ActivitiesSummaryCronService],
})
export class ActivitiesModule {}
