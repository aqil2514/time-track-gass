import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ActivitiesDailySummaryPerCategoryCronHelper } from '../services/helpers/activities-cron-daily-summary-per-category.service';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Processor(QUERY_NAME.DAILY_CATEGORY)
export class DailySummaryCategoryProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySummaryCategoryProcessor.name);

  constructor(
    private readonly helper: ActivitiesDailySummaryPerCategoryCronHelper,
  ) {
    super();
  }
  // async process(job: Job) {
  //   const { userId } = job.data;
  //   await job.updateProgress(10);

  //   const [relevantCategories, userActivities] = await Promise.all([
  //     this.helper.getCategoryByUser(userId),
  //     this.helper.getUserDailyActivity([userId]),
  //   ]);

  //   await job.updateProgress(30);

  //   if (!relevantCategories || userActivities.length === 0) {
  //     await job.updateProgress(100);
  //     return;
  //   }
  //   const summary = await this.helper.getDailyAiSummary(
  //     userActivities,
  //     relevantCategories,
  //     userId,
  //   );
  //   await job.updateProgress(80);

  //   await this.helper.saveToDb(summary);
  //   await job.updateProgress(100);
  // }

  async process(job: Job) {
    const { userId } = job.data;

    // Step 1 : Ambil aktivitas dan kategori yang relevan dengan user
    const [relevantCategories, userActivities] = await Promise.all([
      this.helper.getCategoryByUser(userId),
      this.helper.getUserDailyActivity([userId]),
    ]);

    // Kalo gak relevan dan ga ada aktivitas, stop sampai sini prosesnya
    if (!relevantCategories || userActivities.length === 0) {
      await job.updateProgress(100);
      return;
    }

    const summary = await this.helper.getDailyAiSummary(
      userActivities,
      relevantCategories,
      userId,
    );

     await this.helper.saveToDb(summary);

    return { summary };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} - summary completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - processing...`);
  }
}
