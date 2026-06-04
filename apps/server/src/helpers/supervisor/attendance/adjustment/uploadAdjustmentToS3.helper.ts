import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export async function uploadAdjustmentToS3(
  s3Client: S3Client,
  file: Express.Multer.File,
): Promise<string> {
  const extension = file.mimetype.split('/')[1];
  const s3Key = `attendance/adjustment/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: 'tracker',
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return s3Key;
}
