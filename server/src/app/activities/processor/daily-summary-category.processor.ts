import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ActivitiesDailySummaryPerCategoryCronHelper } from '../services/helpers/activities-cron-daily-summary-per-category.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { DailySummaryPerCategory } from '../interface/daily_summary_per_category.interface';

@Processor('daily-category-summary-queue')
export class DailySummaryCategoryProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySummaryCategoryProcessor.name);

  constructor(
    private readonly helper: ActivitiesDailySummaryPerCategoryCronHelper,
  ) {
    super();
  }
  async process(job: Job) {
    const { userId } = job.data;
    await job.updateProgress(10);

    const [relevantCategories, userActivities] = await Promise.all([
      this.helper.getCategoryByUser(userId),
      this.helper.getUserDailyActivity([userId]),
    ]);

    await job.updateProgress(30);

    if (!relevantCategories || userActivities.length === 0) {
      await job.updateProgress(100);
      return;
    }
    const summary = await this.helper.getDailyAiSummary(
      userActivities,
      relevantCategories,
      userId,
    );
    await job.updateProgress(80);
    
    await this.helper.saveToDb(summary);
    await job.updateProgress(100);
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
