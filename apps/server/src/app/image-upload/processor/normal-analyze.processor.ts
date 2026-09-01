import { GoogleGenAI } from '@google/genai';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { buildPrompt } from 'src/helpers/image-upload/normal-analyze-processor/build-prompt.helper';
import {
  createNewAnalyzeData,
  ZImageAnalyzeData,
} from 'src/helpers/image-upload/normal-analyze-processor/create-to-db';
import {
  computeImageHash,
  detectIdle,
} from 'src/helpers/image-upload/normal-analyze-processor/detect-idle.helper';
import { analyzeImage } from 'src/helpers/image-upload/normal-analyze-processor/gemini-analyze.helper';
import { PrismaService } from 'src/services/prisma/prisma.service';

interface ProcessData {
  userId: string;
  s3Key: string;
  imageUrl: string;
  workSessionId: string | null;
  createdAt: string;
}

const models = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'];

@Processor(QUERY_NAME.NORMAL_ANALYZE)
export class NormalAnalyzeProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('GEMINI_AI')
    private readonly gemini: GoogleGenAI,
  ) {
    super();
  }
  private readonly logger = new Logger(NormalAnalyzeProcessor.name);

  async process(job: Job) {
    const data: ProcessData = job.data;
    const userId = job.data?.userId ?? 'unknown';
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;

    const { imageUrl, ...rest } = data;

    this.logger.log(
      `Starting normal analyze job for user ${userId} on attempt ${attempt}/${maxAttempts}`,
    );

    // Step 1: Hitung pHash dan deteksi idle
    const imageHash = await computeImageHash(imageUrl);
    const isIdle = await detectIdle(this.prisma, userId, imageHash);

    if (isIdle) {
      this.logger.log(
        `User ${userId} - idle detected, category will be overridden after AI analysis`,
      );
    }

    // Step 2: Build prompt berdasarkan divisi user
    const prompt = await buildPrompt(this.prisma, rest.userId);
    // Step 3: Pilih model berdasarkan jumlah attempt
    const model = models[Math.min(job.attemptsMade, models.length - 1)];

    this.logger.log(
      `User ${userId} using model ${model} on attempt ${attempt}/${maxAttempts}`,
    );

    try {
      // Step 4: Analisis gambar dengan Gemini
      const res = await analyzeImage(this.gemini, model, prompt, imageUrl);
      const analyzedData = JSON.parse(res.text);

      this.logger.log(
        `User ${userId} analyze succeeded with model ${model} on attempt ${attempt}/${maxAttempts}`,
      );

      const mappedData: ZImageAnalyzeData = {
        app_name: analyzedData.app_name,
        window_title: analyzedData.window_title,
        category: isIdle ? 'idle' : analyzedData.category,
        summary: analyzedData.summary,
        user_id: userId,
        s3_key: rest.s3Key,
        work_session_id: rest.workSessionId,
        created_at: rest.createdAt,
        image_hash: imageHash,
      };

      // Step 5: Simpan hasil analisis ke DB
      await createNewAnalyzeData(this.prisma, mappedData);

      this.logger.log(
        `User ${userId} analyze data saved to database on attempt ${attempt}/${maxAttempts}`,
      );

      return res;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `User ${userId} analyze failed with model ${model} on attempt ${attempt}/${maxAttempts}: ${message}`,
      );

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `✅ User ${job.data?.userId ?? 'unknown'} - normal analyze job completed`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;

    this.logger.error(
      `❌ User ${job.data?.userId ?? 'unknown'} - normal analyze job failed on attempt ${attempt}/${maxAttempts}: ${error.message}`,
    );

    if (job.attemptsMade >= maxAttempts) {
      const data: ProcessData = job.data;

      let imageHash: string | undefined;
      let isIdle = false;
      try {
        imageHash = await computeImageHash(data.imageUrl);
        isIdle = await detectIdle(this.prisma, data.userId, imageHash);
      } catch {
        this.logger.warn(
          `⚠️ User ${data.userId} - failed to compute image hash in fallback`,
        );
      }

      await createNewAnalyzeData(this.prisma, {
        user_id: data.userId,
        s3_key: data.s3Key,
        work_session_id: data.workSessionId,
        created_at: data.createdAt,
        category: isIdle ? 'idle' : 'ai_error',
        app_name: 'AI Error',
        window_title: 'Analisis Gagal',
        summary: isIdle
          ? 'Analisis AI gagal, sistem mendeteksi adanya gambar yang sama 3x berturut-turut'
          : 'Analisis AI gagal, namun sementara tetap dianggap jam kerja aktif.',
        image_hash: imageHash,
      });

      this.logger.warn(
        `⚠️ User ${data.userId} - fallback ai_error record saved after ${maxAttempts} failed attempts`,
      );
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `⏳ User ${job.data?.userId ?? 'unknown'} - normal analyze job active`,
    );
  }
}
