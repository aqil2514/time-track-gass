import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import Redis from 'ioredis';
import {
  getSlotInvalid,
  getSlotS3Keys,
  clearSlotS3Keys,
} from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';

@Processor(QUERY_NAME.MANUAL_SLOT_STATUS)
export class ManualStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(ManualStatusProcessor.name);

  constructor(
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job) {
    const { userId, slotId, date } = job.data;

    const invalidImages = await getSlotInvalid(this.redis, userId, slotId, date);
    if (!invalidImages?.length) {
      return { status: 'all-success' };
    }

    const allS3Keys = await getSlotS3Keys(this.redis, userId, slotId, date);
    if (allS3Keys?.length) {
      await Promise.all(
        allS3Keys.map((key) =>
          this.s3Client
            .send(new DeleteObjectCommand({ Bucket: 'tracker', Key: key }))
            .catch((err) => this.logger.error(`Gagal hapus S3 key ${key}: ${err.message}`)),
        ),
      );
      await clearSlotS3Keys(this.redis, userId, slotId, date);
      this.logger.log(`User ${userId} - ${allS3Keys.length} S3 key dihapus karena ada gambar invalid`);
    }

    return { status: 'has-invalid', count: invalidImages.length };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`[OK] User ${job.data.userId} slot ${job.data.slotId} - flow selesai`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`[FAIL] User ${job.data.userId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`[ACTIVE] User ${job.data.userId} - sedang diproses...`);
  }
}
