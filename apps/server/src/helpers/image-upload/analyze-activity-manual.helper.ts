import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FlowChildJob, FlowProducer } from 'bullmq';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { TIMEZONE } from 'src/constants/timezone';
import { ImageWithDate } from 'src/app/image-upload/services/image-validation.service';

export async function uploadToS3Manual(
  s3Client: S3Client,
  file: ImageWithDate,
  userId: string,
): Promise<string> {
  const mimeType = file.file.mimetype;
  const extension = mimeType.split('/')[1];
  const s3Key = `Activity-${userId}-${file.date.getTime()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: 'tracker',
    Key: s3Key,
    Body: file.file.buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return s3Key;
}

export async function enqueueManualAnalyze(
  manualAnalyzeFlow: FlowProducer,
  files: ImageWithDate[],
  s3Keys: string[],
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const formattedDate = format(localDate, 'dd-MM-yyyy');

  const childrenJobs: FlowChildJob[] = files.map((file, index) => ({
    name: 'analyze-manual-upload',
    queueName: QUERY_NAME.MANUAL_ANALYZE,
    data: {
      userId,
      s3Key: s3Keys[index],
      detectedDate: file.date,
    },
    opts: {
      jobId: `file-${slotId}-${userId}-${file.file.originalname}-${Date.now()}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  }));

  await manualAnalyzeFlow.add({
    name: 'aggregate-manual-analyze',
    queueName: QUERY_NAME.MANUAL_SLOT_STATUS,
    data: { slotId, userId },
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
