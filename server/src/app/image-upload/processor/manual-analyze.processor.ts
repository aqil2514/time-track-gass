import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { ImageScannerHelper } from '../services/helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from '../services/helpers/analyzer-agent-helper.service';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { subHours } from 'date-fns/subHours';

@Processor(QUERY_NAME.MANUAL_ANALYZE)
export class ManualAnalyzeProcessor extends WorkerHost {
  private readonly logger = new Logger(ManualAnalyzeProcessor.name);

  constructor(
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
    private readonly helper: ImageScannerHelper,
    private readonly analyzerAgent: AnalyzerAgentHelperService,
  ) {
    super();
  }
  async process(job: Job) {
    const { userId, s3Key, detectedDate } = job.data;

    this.logger.log('Mengambil data dari S3');
    const command = new GetObjectCommand({ Key: s3Key, Bucket: 'tracker' });
    const response = await this.s3Client.send(command);
    const mimeType = response.ContentType || 'image/png';

    this.logger.log('Data berhasil didapat. Mengubah ke bentuk byte');
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const base64Image = buffer.toString('base64');

    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    this.logger.log('Data berhasil diubah ke byte. Menganalisis AI');
    const { data } = await this.analyzerAgent.analyzerAgentMapper(
      'gemini-ai',
      imageDataUrl,
      userId,
    );

    const originalDate = new Date(detectedDate);
    const adjustedDate = subHours(originalDate, 7);

    const mappedData = {
      ...(data as any),
      user_id: userId,
      s3_key: s3Key,
      created_at: adjustedDate.toISOString(),
      interval: 7.5,
    };

    this.logger.log('Analisis AI berhasil, menambahkan ke db');
    await this.helper.createNewData(mappedData);

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
