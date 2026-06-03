import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { QUERY_NAME } from 'src/constants/queue.constant';
import {
  getCategoryByUser,
  getUserDailyActivity,
  getDailyAiSummary,
  saveDailySummaryPerCategory,
} from 'src/helpers/activities/processor/dailySummaryPerCategory.helper';

@Processor(QUERY_NAME.DAILY_CATEGORY)
export class DailySummaryCategoryProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySummaryCategoryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('GEMINI_AI') private readonly gemini: GoogleGenAI,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId } = job.data;

    // Step 1: Ambil aktivitas dan kategori relevan
    const [relevantCategories, userActivities] = await Promise.all([
      getCategoryByUser(this.prisma, userId),
      getUserDailyActivity(this.prisma, [userId]),
    ]);

    if (!relevantCategories || userActivities.length === 0) {
      await job.updateProgress(100);
      return;
    }

    // Step 2: Generate AI summary
    const summary = await getDailyAiSummary(
      this.gemini,
      userActivities,
      relevantCategories,
      userId,
    );

    // Step 3: Simpan ke DB
    await saveDailySummaryPerCategory(this.prisma, summary);

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
