import { GoogleGenAI } from '@google/genai';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { Job } from 'bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { buildPrompt } from 'src/helpers/image-upload/normal-analyze-processor/build-prompt.helper';
import { createNewAnalyzeData } from 'src/helpers/image-upload/normal-analyze-processor/create-to-db';
import { analyzeImage } from 'src/helpers/image-upload/normal-analyze-processor/gemini-analyze.helper';
import { ZImageAnalyzeData } from 'src/services/ai-z/interface/ai-z.interface';

interface ProcessData {
  userId: string;
  s3Key: string;
  imageUrl: string;
  workSessionId: string | null;
  createdAt: string;
}

const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];

@Processor(QUERY_NAME.NORMAL_ANALYZE)
export class NormalAnalyzeProcessor extends WorkerHost {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
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

    const prompt = await buildPrompt(this.supabase, rest.userId);
    const model = models[Math.min(job.attemptsMade, models.length - 1)];

    this.logger.log(
      `User ${userId} using model ${model} on attempt ${attempt}/${maxAttempts}`,
    );

    try {
      const res = await analyzeImage(this.gemini, model, prompt, imageUrl);
      const analyzedData = JSON.parse(res.text);

      this.logger.debug(
        `User ${userId} analyzed data: ${JSON.stringify(analyzedData)}`,
      );

      this.logger.log(
        `User ${userId} analyze succeeded with model ${model} on attempt ${attempt}/${maxAttempts}`,
      );

      const mappedData = {
        app_name: analyzedData.app_name,
        window_title: analyzedData.window_title,
        category: analyzedData.category,
        summary: analyzedData.summary,
        user_id: userId,
        s3_key: rest.s3Key,
        work_session_id: rest.workSessionId,
        created_at: rest.createdAt,
      };

      this.logger.debug(
        `User ${userId} mapped analyze data: ${JSON.stringify(mappedData)}`,
      );

      await createNewAnalyzeData(this.supabase, mappedData);

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
  onFailed(job: Job, error: Error) {
    const attempt = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 1;

    this.logger.error(
      `❌ User ${job.data?.userId ?? 'unknown'} - normal analyze job failed on attempt ${attempt}/${maxAttempts}: ${error.message}`,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(
      `⏳ User ${job.data?.userId ?? 'unknown'} - normal analyze job active`,
    );
  }
}
