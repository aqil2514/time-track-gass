import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ImageScannerHelper } from './helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from './helpers/analyzer-agent-helper.service';
import { ImageWithDate } from './image-validation.service';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import { FLOW_NAME, QUERY_NAME } from 'src/constants/queue.constant';
import { FlowChildJob, FlowProducer, Queue } from 'bullmq';
import { TableName } from 'src/services/supabase/supabase.interface';
import { format, toZonedTime } from 'node_modules/date-fns-tz/dist/cjs';
import { TIMEZONE } from 'src/constants/timezone';

@Injectable()
export class ImageScannerService {
  private logger = new Logger(ImageScannerService.name);
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    @InjectQueue(QUERY_NAME.MANUAL_ANALYZE)
    private readonly manualAnalyzeQueue: Queue,

    @InjectQueue(QUERY_NAME.MANUAL_SLOT_STATUS)
    private readonly manualSlotStatusQueue: Queue,

    @InjectFlowProducer(FLOW_NAME.MANUAL_ANALYZE_FLOW)
    private readonly manualAnalyzeFlow: FlowProducer,

    private readonly helper: ImageScannerHelper,

    private readonly analyzerAgent: AnalyzerAgentHelperService,
  ) {}

  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetry = 4,
    delayMs = 2000,
  ): Promise<T> {
    for (let i = 0; i < maxRetry; i++) {
      try {
        return await fn();
      } catch (error) {
        const is503 =
          (error as any)?.error?.code === 503 ||
          (error as any)?.error?.status === 'UNAVAILABLE';

        if (!is503 || i === maxRetry - 1) throw error;

        const wait = delayMs * Math.pow(2, i);
        this.logger.warn(
          `[Gemini] 503 - retry ${i + 1}/${maxRetry} in ${wait}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
    throw new Error('Max retry exceeded');
  }

  private async getCurrentWorkSession(userId: string) {
    const { data, error } = await this.supabase
      .from(TableName.WorkSessions)
      .select('id')
      .eq('user_id', userId)
      .is('end_at', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async analyzeActivity(imageDataUrl: string, userId: string) {
    const workSession = await this.getCurrentWorkSession(userId);
    const s3Key = await this.helper.uploadToS3(imageDataUrl, userId);

    const { data } = await this.callWithRetry(() =>
      this.analyzerAgent.analyzerAgentMapper('gemini-ai', imageDataUrl, userId),
    );

    const mappedData = {
      ...(data as any),
      user_id: userId,
      s3_key: s3Key,
      work_session_id: workSession ? workSession.id : null,
    };

    await this.helper.createNewData(mappedData);
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

  async analyzeActivityManual(
    files: ImageWithDate[],
    userId: string,
    slotId: number,
    date: string,
  ) {
    const localDate = toZonedTime(new Date(date), TIMEZONE);
    const formattedDate = format(localDate, 'dd-MM-yyyy');

    const childrenJobs = await Promise.all(
      files.map(async (file) => {
        const s3Key = await this.helper.uploadToS3Manual(file, userId);

        const flowJob: FlowChildJob = {
          name: 'analyze-manual-upload',
          queueName: QUERY_NAME.MANUAL_ANALYZE,
          data: {
            userId,
            s3Key,
            detectedDate: file.date,
          },
          opts: {
            jobId: `file-${slotId}-${userId}-${file.file.originalname}-${Date.now()}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        };

        return flowJob;
      }),
    );

    await this.manualAnalyzeFlow.add({
      name: 'aggregate-manual-analyze',
      queueName: QUERY_NAME.MANUAL_SLOT_STATUS,
      data: {
        slotId,
        userId,
      },
      opts: {
        jobId: `manual-analyze-${userId}-${slotId}-${formattedDate}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      children: childrenJobs,
    });
  }

  async isHaveInDb(slotId: number, userId: string, date: string) {
    const localTime = toZonedTime(new Date(date), TIMEZONE);
    const startOfHour = new Date(localTime);
    startOfHour.setHours(slotId, 0, 0, 0);

    const endOfHour = new Date(localTime);
    endOfHour.setHours(slotId, 59, 59, 999);

    const { data, error } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('id')
      .gte('created_at', startOfHour.toISOString())
      .lte('created_at', endOfHour.toISOString())
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return !!data;
  }

  async isHaveInBullMq(slotId: number, userId: string, date: string) {
    const localDate = toZonedTime(new Date(date), TIMEZONE);
    const formattedDate = format(localDate, 'dd-MM-yyyy');

    const flows = await this.manualAnalyzeFlow.getFlow({
      id: `manual-analyze-${userId}-${slotId}-${formattedDate}`,
      queueName: QUERY_NAME.MANUAL_SLOT_STATUS,
    });

    return !!flows;
  }
}
