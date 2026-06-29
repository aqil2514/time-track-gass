import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GoogleGenAI } from '@google/genai';
import Redis from 'ioredis';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { fetchImageFromS3 } from 'src/helpers/image-upload/manual-analyze-processor/fetch-from-s3.helper';
import { buildPrompt } from 'src/helpers/image-upload/normal-analyze-processor/build-prompt.helper';
import { analyzeManualImage } from 'src/helpers/image-upload/manual-analyze-processor/analyze-manual-image.helper';
import { createNewAnalyzeData, ZImageAnalyzeData } from 'src/helpers/image-upload/normal-analyze-processor/create-to-db';
import { extractDateTimeFromImage } from 'src/helpers/image-upload/manual-analyze-processor/extract-datetime.helper';
import { validateDateTimeAgainstSlot } from 'src/helpers/image-upload/manual-analyze-processor/validate-datetime.helper';
import { cropTaskbar } from 'src/helpers/image-upload/manual-analyze-processor/crop-taskbar.helper';
import { appendSlotInvalid, SlotInvalidStatus } from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';

const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];

interface ImageJobItem {
  s3Key: string;
  originalFilename: string;
}

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
    const { userId, slotId, date, images, model: jobModel } = job.data as {
      userId: string;
      slotId: number;
      date: string;
      images: ImageJobItem[];
      model: string;
    };

    const model = jobModel ?? models[0];

    this.logger.log(`Mulai proses - user=${userId} slot=${slotId} model=${model} totalFiles=${images.length}`);

    const prompt = await buildPrompt(this.prisma, userId);

    const validResults: ZImageAnalyzeData[] = [];
    const invalidResults: SlotInvalidStatus[] = [];

    for (const { s3Key, originalFilename } of images) {
      this.logger.log(`[FILE] user=${userId} file="${originalFilename}"`);

      // Step 1: Ambil image dari S3
      const s3Result = await fetchImageFromS3(this.s3Client, s3Key);
      if (!s3Result) {
        const reason = 'File gambar sudah dihapus dari storage';
        this.logger.warn(`[SKIP] user=${userId} file="${originalFilename}" - S3 key tidak ditemukan`);
        invalidResults.push({ s3Key, reason, originalFilename });
        continue;
      }
      const { base64Data, mimeType } = s3Result;

      // Step 2: Crop taskbar lalu extract datetime
      const taskbar = await cropTaskbar(base64Data, mimeType);
      const datetimeResult = await extractDateTimeFromImage(
        this.gemini,
        model,
        taskbar.base64Data,
        taskbar.mimeType,
        originalFilename,
      );

      if (!datetimeResult) {
        const reason = 'Gagal membaca jam dari gambar. Tips: Beri nama file dengan format YYYY-MM-DD_HH-mm-ss.format_file (contoh: 2025-06-26_08-30-00.jpg) sebagai cadangan jika sistem gagal membaca jam dari gambar.';
        this.logger.warn(`[SKIP] user=${userId} file="${originalFilename}" - gagal extract datetime`);
        invalidResults.push({ s3Key, reason, originalFilename });
        continue;
      }

      this.logger.log(`[DATETIME] user=${userId} file="${originalFilename}" source=${datetimeResult.source} -> ${datetimeResult.date.toISOString()}`);

      // Step 3: Validasi tanggal & jam sesuai slot
      const dtValidation = validateDateTimeAgainstSlot(
        datetimeResult.date,
        date,
        slotId,
        datetimeResult.source,
      );

      if (!dtValidation.valid) {
        this.logger.warn(`[SKIP] user=${userId} file="${originalFilename}" - validasi datetime gagal: ${dtValidation.reason}`);
        invalidResults.push({ s3Key, reason: dtValidation.reason, originalFilename });
        continue;
      }

      this.logger.log(`[VALID] user=${userId} file="${originalFilename}" - datetime valid, lanjut analisis`);

      // Step 4: Analisis gambar dengan Gemini
      this.logger.log(`[GEMINI] user=${userId} file="${originalFilename}" model=${model} - mengirim ke Gemini...`);
      const res = await analyzeManualImage(this.gemini, model, prompt, base64Data, mimeType);
      const analyzedData = JSON.parse(res.text);

      validResults.push({
        app_name: analyzedData.app_name,
        window_title: analyzedData.window_title,
        category: analyzedData.category,
        summary: analyzedData.summary,
        user_id: userId,
        s3_key: s3Key,
        created_at: datetimeResult.date.toISOString(),
        interval: 7.5,
      });

      this.logger.log(`[OK] user=${userId} file="${originalFilename}" category=${analyzedData.category}`);
    }

    // Step 5: Keputusan akhir
    if (invalidResults.length > 0) {
      this.logger.warn(`[INVALID] user=${userId} slot=${slotId} - ${invalidResults.length} gambar tidak valid, batalkan semua`);

      // Hapus semua S3 keys
      await Promise.all(
        images.map(({ s3Key }) =>
          this.s3Client
            .send(new DeleteObjectCommand({ Bucket: 'tracker', Key: s3Key }))
            .catch((err) => this.logger.error(`Gagal hapus S3 key ${s3Key}: ${err.message}`)),
        ),
      );

      // Simpan semua invalid ke Redis
      for (const item of invalidResults) {
        await appendSlotInvalid(this.redis, userId, slotId, date, item);
      }

      return { status: 'invalid', invalidCount: invalidResults.length };
    }

    // Semua valid — batch insert ke DB
    this.logger.log(`[DB] user=${userId} slot=${slotId} - semua valid, simpan ${validResults.length} record ke DB`);
    await Promise.all(validResults.map((data) => createNewAnalyzeData(this.prisma, data)));

    this.logger.log(`✅ user=${userId} slot=${slotId} - ${validResults.length} record berhasil disimpan`);
    return { status: 'success', count: validResults.length };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} slot ${job.data.slotId} - selesai`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} slot ${job.data.slotId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} slot ${job.data.slotId} - sedang diproses...`);
  }
}
