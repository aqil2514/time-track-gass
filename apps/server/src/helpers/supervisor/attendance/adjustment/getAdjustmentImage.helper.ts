import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getAdjustmentImage(
  s3Client: S3Client,
  s3Key: string,
): Promise<string | null> {
  if (!s3Key) return null;

  const command = new GetObjectCommand({ Bucket: 'tracker', Key: s3Key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
