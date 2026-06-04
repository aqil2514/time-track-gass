import { PrismaService } from 'src/services/prisma/prisma.service';

export async function softDeleteActivities(
  prisma: PrismaService,
  activityIds: string[],
): Promise<void> {
  await prisma.ai_screen_report.updateMany({
    where: { id: { in: activityIds } },
    data: { deleted_at: new Date() },
  });
}
