import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function fetchImageFromS3(
  s3Client: S3Client,
  s3Key: string,
): Promise<{ base64Data: string; mimeType: string } | null> {
  try {
    const command = new GetObjectCommand({ Bucket: 'tracker', Key: s3Key });
    const response = await s3Client.send(command);

    const mimeType = response.ContentType || 'image/png';
    const byteArray = await response.Body.transformToByteArray();
    const base64Data = Buffer.from(byteArray).toString('base64');

    return { base64Data, mimeType };
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.message?.includes('does not exist')) {
      return null;
    }
    throw err;
  }
}
