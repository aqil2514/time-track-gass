import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function deleteAdjustment(
  prisma: PrismaService,
  s3Client: S3Client,
  adjustmentId: string,
  s3Key: string,
): Promise<void> {
  await prisma.activity_adjustments.delete({
    where: { id: BigInt(adjustmentId) },
  });

  if (s3Key) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: 'tracker', Key: s3Key }),
      );
    } catch (err) {
      console.error('Gagal menghapus file dari S3:', err);
    }
  }
}
