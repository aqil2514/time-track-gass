import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  AIScreenReportPopulateUser,
  AIScreenReportPopulateUserAndS3Image,
} from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function mapToImageUrl(
  s3Client: S3Client,
  payload: AIScreenReportPopulateUser,
): Promise<AIScreenReportPopulateUserAndS3Image> {
  const { s3_key, ...rest } = payload;

  if (!s3_key) return { ...rest, image_url: '' };

  const command = new GetObjectCommand({ Bucket: 'tracker', Key: s3_key });
  const image_url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { ...rest, image_url };
}
