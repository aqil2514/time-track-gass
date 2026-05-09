import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { Queue } from 'bullmq';
import { TableName } from 'src/services/supabase/supabase.interface';

export async function uploadToS3(
  s3Client: S3Client,
  imageDataUrl: string,
  userId: string,
) {
  const mimeType = imageDataUrl.split(',')[0].match(/:(.*?);/)[1];
  const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
  const extension = mimeType.split('/')[1];

  const s3Key = `Activity-${userId}-${Date.now()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: 'tracker',
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return s3Key;
}

export async function getActiveSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from(TableName.WorkSessions)
    .select('id')
    .eq('user_id', userId)
    .is('end_at', null)
    .maybeSingle();

  if (error) throw error;

  return data?.id ?? null;
}

export async function enqueueAnalyze(
  queue: Queue,
  s3Client: S3Client,
  s3Key: string,
  userId: string,
  workSessionId: string,
) {
  const command = new GetObjectCommand({
    Bucket: 'tracker',
    Key: s3Key,
  });

  const imageUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  await queue.add(
    'normal-analyze-upload',
    {
      userId,
      s3Key,
      imageUrl,
      workSessionId,
      createdAt: new Date().toISOString(),
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}
