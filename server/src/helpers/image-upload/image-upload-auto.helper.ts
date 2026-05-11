import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UnprocessableEntityException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { differenceInMilliseconds } from 'date-fns';
import { Queue } from 'bullmq';
import { TableName } from 'src/services/supabase/supabase.interface';

const AUTO_UPLOAD_MIN_INTERVAL_MS = 4 * 60 * 1000 + 50 * 1000;
const AUTO_UPLOAD_ERROR_MESSAGE = 'Minimal jeda upload otomatis adalah 5 menit.';

type AutoAnalyzeJobData = {
  userId?: string;
  createdAt?: string;
};

async function getLatestQueuedAutoUploadAt(queue: Queue, userId: string) {
  const jobs = await queue.getJobs(
    ['waiting', 'active', 'delayed', 'prioritized', 'paused'],
    0,
    100,
    true,
  );

  let latestTimestamp: Date | null = null;

  for (const job of jobs) {
    const data = job.data as AutoAnalyzeJobData;
    if (data.userId !== userId || !data.createdAt) continue;

    const createdAt = new Date(data.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;

    if (!latestTimestamp || createdAt > latestTimestamp) {
      latestTimestamp = createdAt;
    }
  }

  return latestTimestamp;
}

async function getLatestStoredAutoUploadAt(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from(TableName.AIScreenReport)
    .select('created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ? new Date(data.created_at) : null;
}

export async function assertAutoUploadCooldown(
  supabase: SupabaseClient,
  queue: Queue,
  userId: string,
) {
  const [latestQueuedAt, latestStoredAt] = await Promise.all([
    getLatestQueuedAutoUploadAt(queue, userId),
    getLatestStoredAutoUploadAt(supabase, userId),
  ]);

  const latestAcceptedAt =
    latestQueuedAt && latestStoredAt
      ? latestQueuedAt > latestStoredAt
        ? latestQueuedAt
        : latestStoredAt
      : latestQueuedAt ?? latestStoredAt;

  if (!latestAcceptedAt) return;

  const diff = differenceInMilliseconds(new Date(), latestAcceptedAt);

  if (diff < AUTO_UPLOAD_MIN_INTERVAL_MS) {
    throw new UnprocessableEntityException({
      message: AUTO_UPLOAD_ERROR_MESSAGE,
    });
  }
}

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
