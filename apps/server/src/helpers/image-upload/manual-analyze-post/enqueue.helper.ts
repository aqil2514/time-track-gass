import { Queue } from 'bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { S3UploadResult } from './upload-s3.helper';

export async function enqueueManualAnalyzeJobs(
  manualAnalyzeQueue: Queue,
  uploads: S3UploadResult[],
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  await manualAnalyzeQueue.add(
    'analyze-manual-upload',
    {
      userId,
      slotId,
      date,
      images: uploads.map(({ s3Key, originalFilename }) => ({ s3Key, originalFilename })),
    },
    {
      jobId: `manual-analyze-${userId}-${slotId}-${date}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}
