import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { QUERY_NAME } from 'src/constants/queue.constant';
import {
  getPendingCategoryDates,
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

    // Step 1: Cari kategori yang relevan untuk user ini
    const relevantCategories = await getCategoryByUser(this.prisma, userId);
    if (!relevantCategories) {
      await job.updateProgress(100);
      return;
    }

    // Step 2: Cari tanggal-tanggal yang belum punya summary (termasuk
    // backfill kalau ada hari yang bolong karena error/downtime sebelumnya)
    const pendingDates = await getPendingCategoryDates(this.prisma, userId);
    if (pendingDates.length === 0) {
      await job.updateProgress(100);
      return;
    }

    const results = [];

    for (let i = 0; i < pendingDates.length; i++) {
      const dateKey = pendingDates[i];

      const userActivities = await getUserDailyActivity(
        this.prisma,
        [userId],
        dateKey,
      );

      if (userActivities.length > 0) {
        const summary = await getDailyAiSummary(
          this.gemini,
          userActivities,
          relevantCategories,
          userId,
          dateKey,
        );

        await saveDailySummaryPerCategory(this.prisma, summary);
        results.push({ date: dateKey, summary });
      }

      await job.updateProgress(Math.round(((i + 1) / pendingDates.length) * 100));
    }

    return { results };
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
