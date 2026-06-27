import { FlowChildJob, FlowProducer } from 'bullmq';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Redis from 'ioredis';
import { FLOW_NAME, QUERY_NAME } from 'src/constants/queue.constant';
import { TIMEZONE } from 'src/constants/timezone';
import { setSlotS3Keys } from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';
import { S3UploadResult } from './upload-s3.helper';

export async function enqueueManualAnalyzeJobs(
  manualAnalyzeFlow: FlowProducer,
  redis: Redis,
  uploads: S3UploadResult[],
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const formattedDate = format(localDate, 'dd-MM-yyyy');

  await setSlotS3Keys(redis, userId, slotId, date, uploads.map((u) => u.s3Key));

  const childrenJobs: FlowChildJob[] = uploads.map(({ s3Key, originalFilename }) => ({
    name: 'analyze-manual-upload',
    queueName: QUERY_NAME.MANUAL_ANALYZE,
    data: {
      userId,
      s3Key,
      originalFilename,
      slotId,
      date,
    },
    opts: {
      jobId: `file-${slotId}-${userId}-${s3Key}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  }));

  await manualAnalyzeFlow.add({
    name: 'aggregate-manual-analyze',
    queueName: QUERY_NAME.MANUAL_SLOT_STATUS,
    data: { slotId, userId, date },
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
