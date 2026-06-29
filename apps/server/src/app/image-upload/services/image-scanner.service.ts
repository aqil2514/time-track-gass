import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { Queue } from 'bullmq';
import {
  assertAutoUploadCooldown,
  enqueueAnalyze,
  getActiveSession,
  uploadToS3,
} from 'src/helpers/image-upload/image-upload-auto.helper';
import { getActivities } from 'src/helpers/image-upload/get-activities.helper';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/services/prisma/prisma.service';

@Injectable()
export class ImageScannerService {
  private logger = new Logger(ImageScannerService.name);
  constructor(
    @InjectQueue(QUERY_NAME.NORMAL_ANALYZE)
    private readonly normalAnalyzeQueue: Queue,

    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,

    private readonly prisma: PrismaService,
  ) {}

  async addToNormalQueue(imageDataUrl: string, userId: string) {
    const workIdSession = await getActiveSession(this.prisma, userId);

    if (!workIdSession) {
      throw new ConflictException({
        code: 'NO_ACTIVE_WORK_SESSION',
        message:
          'No active work session. Please start a session before uploading screenshots.',
      });
    }

    await assertAutoUploadCooldown(this.prisma, this.normalAnalyzeQueue, userId);

    const s3Key = await uploadToS3(this.s3Client, imageDataUrl, userId);

    await enqueueAnalyze(
      this.normalAnalyzeQueue,
      this.s3Client,
      s3Key,
      userId,
      workIdSession,
    );
  }

  async getActivities() {
    return getActivities(this.prisma);
  }
}
