import { Queue } from 'bullmq';
import { S3UploadResult } from './upload-s3.helper';

export async function enqueueManualAnalyzeJobs(
  manualAnalyzeQueue: Queue,
  uploads: S3UploadResult[],
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  const jobId = `manual-analyze-${userId}-${slotId}-${date}`;

  const existing = await manualAnalyzeQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'completed' || state === 'failed') {
      await existing.remove();
    }
  }

  await manualAnalyzeQueue.add(
    'analyze-manual-upload',
    {
      userId,
      slotId,
      date,
      images: uploads.map(({ s3Key, originalFilename }) => ({ s3Key, originalFilename })),
    },
    {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}
