import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ImageWithDate } from './image-validation.service';
import { InjectFlowProducer, InjectQueue } from '@nestjs/bullmq';
import { FLOW_NAME, QUERY_NAME } from 'src/constants/queue.constant';
import { FlowProducer, Queue } from 'bullmq';
import {
  assertAutoUploadCooldown,
  enqueueAnalyze,
  getActiveSession,
  uploadToS3,
} from 'src/helpers/image-upload/image-upload-auto.helper';
import { getActivities } from 'src/helpers/image-upload/get-activities.helper';
import {
  checkIsHaveInDb,
  checkIsHaveInBullMq,
} from 'src/helpers/image-upload/get-manual-status.helper';
import {
  uploadToS3Manual,
  enqueueManualAnalyze,
} from 'src/helpers/image-upload/analyze-activity-manual.helper';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class ImageScannerService {
  private logger = new Logger(ImageScannerService.name);
  constructor(
    @InjectQueue(QUERY_NAME.MANUAL_ANALYZE)
    private readonly manualAnalyzeQueue: Queue,

    @InjectQueue(QUERY_NAME.MANUAL_SLOT_STATUS)
    private readonly manualSlotStatusQueue: Queue,

    @InjectQueue(QUERY_NAME.NORMAL_ANALYZE)
    private readonly normalAnalyzeQueue: Queue,

    @InjectFlowProducer(FLOW_NAME.MANUAL_ANALYZE_FLOW)
    private readonly manualAnalyzeFlow: FlowProducer,

    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,

    private readonly prisma: PrismaService,
  ) {}

  async addToNormalQueue(imageDataUrl: string, userId: string) {
    // Step 1: Cek active work session
    const workIdSession = await getActiveSession(this.prisma, userId);

    if (!workIdSession) {
      throw new ConflictException({
        code: 'NO_ACTIVE_WORK_SESSION',
        message:
          'No active work session. Please start a session before uploading screenshots.',
      });
    }

    // Step 2: Cek cooldown upload otomatis
    await assertAutoUploadCooldown(
      this.prisma,
      this.normalAnalyzeQueue,
      userId,
    );

    // Step 3: Upload gambar ke S3
    const s3Key = await uploadToS3(this.s3Client, imageDataUrl, userId);

    // Step 4: Tambahkan job ke queue
    await enqueueAnalyze(
      this.normalAnalyzeQueue,
      this.s3Client,
      s3Key,
      userId,
      workIdSession,
    );
  }

  async getActivities() {
    // Step 1: Ambil semua data aktivitas dari DB
    return getActivities(this.prisma);
  }

  async analyzeActivityManual(
    files: ImageWithDate[],
    userId: string,
    slotId: number,
    date: string,
  ) {
    // Step 1: Upload tiap file ke S3
    const s3Keys = await Promise.all(
      files.map((file) => uploadToS3Manual(this.s3Client, file, userId)),
    );

    // Step 2: Enqueue BullMQ flow untuk analisis manual
    await enqueueManualAnalyze(
      this.manualAnalyzeFlow,
      files,
      s3Keys,
      userId,
      slotId,
      date,
    );
  }

  async isHaveInDb(slotId: number, userId: string, date: string) {
    // Step 1: Cek apakah data sudah ada di DB untuk slot dan tanggal tersebut
    return checkIsHaveInDb(this.prisma, slotId, userId, date);
  }

  async isHaveInBullMq(slotId: number, userId: string, date: string) {
    // Step 1: Cek apakah job masih ada di queue BullMQ
    return checkIsHaveInBullMq(this.manualAnalyzeFlow, slotId, userId, date);
  }
}
