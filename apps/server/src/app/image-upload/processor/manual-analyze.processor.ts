import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { S3Client } from '@aws-sdk/client-s3';
import { GoogleGenAI } from '@google/genai';
import Redis from 'ioredis';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { fetchImageFromS3 } from 'src/helpers/image-upload/manual-analyze-processor/fetch-from-s3.helper';
import { buildPrompt } from 'src/helpers/image-upload/normal-analyze-processor/build-prompt.helper';
import { analyzeManualImage } from 'src/helpers/image-upload/manual-analyze-processor/analyze-manual-image.helper';
import { createNewAnalyzeData } from 'src/helpers/image-upload/normal-analyze-processor/create-to-db';
import { extractDateTimeFromImage } from 'src/helpers/image-upload/manual-analyze-processor/extract-datetime.helper';
import { validateDateTimeAgainstSlot } from 'src/helpers/image-upload/manual-analyze-processor/validate-datetime.helper';
import { appendSlotInvalid } from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';

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
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId, s3Key, originalFilename, slotId, date } = job.data;
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;
    const model = models[Math.min(job.attemptsMade, models.length - 1)];

    this.logger.log(
      `[${attempt}/${maxAttempts}] Mulai proses - user=${userId} slot=${slotId} model=${model} file="${originalFilename}"`,
    );

    // Step 1: Ambil image dari S3
    const s3Result = await fetchImageFromS3(this.s3Client, s3Key);
    if (!s3Result) {
      const reason = 'File gambar sudah dihapus dari storage';
      this.logger.warn(`[SKIP] user=${userId} slot=${slotId} - S3 key tidak ditemukan: ${s3Key}`);
      await appendSlotInvalid(this.redis, userId, slotId, date, { s3Key, reason, originalFilename });
      return { skipped: true, s3Key, reason };
    }
    const { base64Data, mimeType } = s3Result;
    this.logger.log(`[S3] Fetch OK - user=${userId} file="${originalFilename}" mimeType=${mimeType}`);

    // Step 2: Extract datetime — Gemini utama, filename sebagai fallback
    const datetimeResult = await extractDateTimeFromImage(
      this.gemini,
      model,
      base64Data,
      mimeType,
      originalFilename,
    );

    if (!datetimeResult) {
      const reason = 'Gagal membaca jam dari gambar. Tips: Beri nama file dengan format YYYY-MM-DD_HH-mm-ss (contoh: 2025-06-26_08-30-00.jpg) sebagai cadangan jika sistem gagal membaca jam dari gambar.';
      this.logger.warn(`[SKIP] user=${userId} slot=${slotId} file="${originalFilename}" - gagal extract datetime`);
      await this.handleSkip(userId, slotId, date, s3Key, reason, originalFilename);
      return { skipped: true, s3Key, reason };
    }

    this.logger.log(
      `[DATETIME] user=${userId} file="${originalFilename}" source=${datetimeResult.source} -> ${datetimeResult.date.toISOString()}`,
    );

    // Step 3: Validasi tanggal & jam sesuai slot
    const dtValidation = validateDateTimeAgainstSlot(
      datetimeResult.date,
      date,
      slotId,
      datetimeResult.source,
    );

    if (!dtValidation.valid) {
      const reason = dtValidation.reason;
      this.logger.warn(`[SKIP] user=${userId} slot=${slotId} file="${originalFilename}" - validasi datetime gagal: ${reason}`);
      await this.handleSkip(userId, slotId, date, s3Key, reason, originalFilename);
      return { skipped: true, s3Key, reason };
    }

    this.logger.log(`[VALID] user=${userId} slot=${slotId} file="${originalFilename}" - datetime valid, lanjut analisis`);

    // Step 4: Build prompt berdasarkan divisi user
    const prompt = await buildPrompt(this.prisma, userId);

    // Step 5: Analisis gambar dengan Gemini
    this.logger.log(`[GEMINI] user=${userId} file="${originalFilename}" model=${model} - mengirim ke Gemini...`);
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
      created_at: datetimeResult.date.toISOString(),
      interval: 7.5,
    };

    // Step 6: Simpan hasil analisis ke DB
    await createNewAnalyzeData(this.prisma, mappedData);

    this.logger.log(
      `[OK] user=${userId} slot=${slotId} file="${originalFilename}" attempt=${attempt}/${maxAttempts} category=${analyzedData.category}`,
    );

    return mappedData;
  }

  private async handleSkip(
    userId: string,
    slotId: number,
    date: string,
    s3Key: string,
    reason: string,
    originalFilename?: string,
  ): Promise<void> {
    await appendSlotInvalid(this.redis, userId, slotId, date, { s3Key, reason, originalFilename });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} - Foto berhasil dianalisis`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    const { userId, s3Key, slotId, date } = job.data;
    const maxAttempts = job.opts.attempts ?? 1;

    this.logger.error(`❌ User ${userId} - failed: ${error.message}`);

    if (job.attemptsMade >= maxAttempts) {
      const slotDate = new Date(date);
      slotDate.setUTCHours(slotId - 7, 30, 0, 0);

      await createNewAnalyzeData(this.prisma, {
        user_id: userId,
        s3_key: s3Key,
        created_at: slotDate.toISOString(),
        interval: 7.5,
        category: 'ai_error',
        app_name: 'AI Error',
        window_title: 'Analisis Gagal',
        summary: 'Analisis AI gagal setelah beberapa percobaan, namun sementara tetap dianggap jam kerja aktif.',
      });

      this.logger.warn(`⚠️ User ${userId} - fallback ai_error record saved after ${maxAttempts} failed attempts`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - sedang diproses...`);
  }
}
