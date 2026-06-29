import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { S3Client } from '@aws-sdk/client-s3';
import Redis from 'ioredis';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { validateLocalImages } from 'src/helpers/image-upload/manual-analyze-post/validate-local.helper';
import { uploadImagesToS3 } from 'src/helpers/image-upload/manual-analyze-post/upload-s3.helper';
import { enqueueManualAnalyzeJobs } from 'src/helpers/image-upload/manual-analyze-post/enqueue.helper';
import {
  checkIsHaveInDb,
  checkIsHaveInBullMq,
  checkIsInvalid,
} from 'src/helpers/image-upload/get-manual-status.helper';
import {
  clearSlotInvalid,
  SlotInvalidStatus,
} from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';

@Injectable()
export class ImageUploadManualService {
  private readonly logger = new Logger(ImageUploadManualService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @InjectQueue(QUERY_NAME.MANUAL_ANALYZE)
    private readonly manualAnalyzeQueue: Queue,
  ) {}

  onModuleInit() {
    this.logger.log('ImageUploadManualService siap');
  }

  async upload(
    images: Express.Multer.File[],
    userId: string,
    slotId: number,
    date: string,
  ) {
    this.logger.log(
      `Upload dimulai - user=${userId} slot=${slotId} date=${date} totalFiles=${images?.length ?? 0}`,
    );

    const { validImages, invalidImages } = validateLocalImages(images);

    if (invalidImages.length > 0) {
      this.logger.warn(
        `Upload ditolak - user=${userId} slot=${slotId}: ${invalidImages.length} file tidak valid (${invalidImages.map((f) => f.filename).join(', ')})`,
      );
      throw new UnprocessableEntityException({
        message: 'Beberapa gambar tidak valid',
        invalidImages,
      });
    }

    this.logger.log(
      `Validasi lokal OK - user=${userId} slot=${slotId}: ${validImages.length} file valid`,
    );

    const uploads = await uploadImagesToS3(this.s3Client, validImages, userId);
    this.logger.log(
      `S3 upload selesai - user=${userId} slot=${slotId}: ${uploads.length} file`,
    );

    await enqueueManualAnalyzeJobs(
      this.manualAnalyzeQueue,
      uploads,
      userId,
      slotId,
      date,
    );
    this.logger.log(
      `BullMQ job enqueued - user=${userId} slot=${slotId} date=${date}`,
    );
  }

  async getStatus(
    userId: string,
    slotId: number,
    date: string,
  ): Promise<
    | { status: 'verified' }
    | { status: 'progress' }
    | { status: 'invalid'; invalidImages: SlotInvalidStatus[] }
    | { status: 'not-found' }
  > {
    const isInDb = await checkIsHaveInDb(this.prisma, slotId, userId, date);
    if (isInDb) return { status: 'verified' };

    const invalidImages = await checkIsInvalid(this.redis, slotId, userId, date);
    if (invalidImages) {
      this.logger.warn(
        `Status invalid - user=${userId} slot=${slotId} date=${date}: ${invalidImages.length} gambar invalid`,
      );
      return { status: 'invalid', invalidImages };
    }

    const isInQueue = await checkIsHaveInBullMq(
      this.manualAnalyzeQueue,
      slotId,
      userId,
      date,
    );
    if (isInQueue) return { status: 'progress' };

    return { status: 'not-found' };
  }

  async clearInvalid(
    userId: string,
    slotId: number,
    date: string,
  ): Promise<void> {
    await clearSlotInvalid(this.redis, userId, slotId, date);
  }
}
