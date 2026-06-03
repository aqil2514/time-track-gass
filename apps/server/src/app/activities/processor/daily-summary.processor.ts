import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { QUERY_NAME } from 'src/constants/queue.constant';
import {
  getSessionActivityByUserId,
  getRawActivityByIds,
  mapToActivityData,
  mapToDailySummaryDbInsert,
  createNewDailySummary,
} from 'src/helpers/activities/processor/dailySummary.helper';

@Processor(QUERY_NAME.DAILY_SUMMARY)
export class DailySummaryProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySummaryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('GEMINI_AI') private readonly gemini: GoogleGenAI,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId } = job.data;

    // Step 1: Ambil session activities hari ini
    const summariesData = await getSessionActivityByUserId(this.prisma, [userId]);

    // Step 2: Ambil raw AI reports berdasarkan raw_ids
    const allRawIds = summariesData.flatMap((s) => s.raw_ids);
    const report = await getRawActivityByIds(this.prisma, allRawIds);

    // Step 3: Map ke ActivityData
    const data = mapToActivityData(report, summariesData);

    // Step 4: Generate AI summary dan build payload
    const mappedData = await mapToDailySummaryDbInsert(this.gemini, data);

    // Step 5: Simpan ke DB
    await createNewDailySummary(this.prisma, mappedData);

    return mappedData;
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
