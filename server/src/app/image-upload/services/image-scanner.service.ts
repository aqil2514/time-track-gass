import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ImageScannerHelper } from './helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from './helpers/analyzer-agent-helper.service';
import { ImageWithDate } from './image-validation.service';
import { InjectQueue } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { Queue } from 'bullmq';

@Injectable()
export class ImageScannerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    @InjectQueue(QUERY_NAME.MANUAL_ANALYZE)
    private readonly manualAnalyzeQueue: Queue,

    private readonly helper: ImageScannerHelper,

    private readonly analyzerAgent: AnalyzerAgentHelperService,
  ) {}

  async analyzeActivity(imageDataUrl: string, userId: string) {
    const s3Key = await this.helper.uploadToS3(imageDataUrl, userId);

    const { data } = await this.analyzerAgent.analyzerAgentMapper(
      'gemini-ai',
      imageDataUrl,
      userId,
    );

    const mappedData = {
      ...(data as any),
      user_id: userId,
      s3_key: s3Key,
    };

    await this.helper.createNewData(mappedData);
  }

  async analyzeActivityManual(files: ImageWithDate[], userId: string) {
    for (const file of files) {
      const s3Key = await this.helper.uploadToS3Manual(file, userId);

      await this.manualAnalyzeQueue.add(
        'manual-upload-queue',
        {
          userId,
          s3Key,
          detectedDate: file.date,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    }
  }

  async getActivities() {
    const { data, error } = await this.supabase
      .from('ai_screen_report')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
