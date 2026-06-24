import phash from 'sharp-phash';
import dist from 'sharp-phash/distance';
import { PrismaService } from 'src/services/prisma/prisma.service';

const IDLE_THRESHOLD = 3;
const IDLE_CONSECUTIVE = 3;

export async function computeImageHash(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  return phash(buffer);
}

export async function detectIdle(
  prisma: PrismaService,
  userId: string,
  newHash: string,
): Promise<boolean> {
  const recentRecords = await prisma.ai_screen_report.findMany({
    where: { user_id: userId, image_hash: { not: null } },
    orderBy: { created_at: 'desc' },
    take: IDLE_CONSECUTIVE,
    select: { image_hash: true },
  });

  if (recentRecords.length < IDLE_CONSECUTIVE) return false;

  return recentRecords.every(
    (record) => dist(newHash, record.image_hash!) <= IDLE_THRESHOLD,
  );
}
