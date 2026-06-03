import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { S3Client } from '@aws-sdk/client-s3';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { fetchImageFromS3 } from 'src/helpers/image-upload/manual-analyze-processor/fetch-from-s3.helper';
import { buildPrompt } from 'src/helpers/image-upload/normal-analyze-processor/build-prompt.helper';
import { analyzeManualImage } from 'src/helpers/image-upload/manual-analyze-processor/analyze-manual-image.helper';
import { createNewAnalyzeData } from 'src/helpers/image-upload/normal-analyze-processor/create-to-db';

const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];

@Processor(QUERY_NAME.MANUAL_ANALYZE)
export class ManualAnalyzeProcessor extends WorkerHost {
  private readonly logger = new Logger(ManualAnalyzeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
    @Inject('GEMINI_AI')
    private readonly gemini: GoogleGenAI,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId, s3Key, detectedDate } = job.data;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;
    const model = models[Math.min(job.attemptsMade, models.length - 1)];

    this.logger.log(
      `Starting manual analyze job for user ${userId} on attempt ${attempt}/${maxAttempts}`,
    );

    // Step 1: Ambil image dari S3
    const { base64Data, mimeType } = await fetchImageFromS3(
      this.s3Client,
      s3Key,
    );

    // Step 2: Build prompt berdasarkan divisi user
    const prompt = await buildPrompt(this.prisma, userId);

    // Step 3: Analisis gambar dengan Gemini
    const res = await analyzeManualImage(
      this.gemini,
      model,
      prompt,
      base64Data,
      mimeType,
    );
    const analyzedData = JSON.parse(res.text);

    const mappedData = {
      app_name: analyzedData.app_name,
      window_title: analyzedData.window_title,
      category: analyzedData.category,
      summary: analyzedData.summary,
      user_id: userId,
      s3_key: s3Key,
      created_at: new Date(detectedDate).toISOString(),
      interval: 7.5,
    };

    // Step 4: Simpan hasil analisis ke DB
    await createNewAnalyzeData(this.prisma, mappedData);

    this.logger.log(
      `User ${userId} manual analyze succeeded on attempt ${attempt}/${maxAttempts}`,
    );

    return mappedData;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} - Foto berhasil dianalisis`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - sedang diproses...`);
  }
}
