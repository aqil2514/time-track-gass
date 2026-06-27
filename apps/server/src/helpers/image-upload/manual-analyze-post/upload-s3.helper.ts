import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export interface S3UploadResult {
  s3Key: string;
  originalFilename: string;
}

export async function uploadImagesToS3(
  s3Client: S3Client,
  images: Express.Multer.File[],
  userId: string,
): Promise<S3UploadResult[]> {
  return Promise.all(images.map((image) => uploadSingle(s3Client, image, userId)));
}

async function uploadSingle(
  s3Client: S3Client,
  image: Express.Multer.File,
  userId: string,
): Promise<S3UploadResult> {
  const ext = image.mimetype.split('/')[1];
  const s3Key = `Activity-manual-${userId}-${randomUUID()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: 'tracker',
      Key: s3Key,
      Body: image.buffer,
      ContentType: image.mimetype,
    }),
  );

  return { s3Key, originalFilename: image.originalname };
}
