import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getActivities(prisma: PrismaService) {
  return prisma.ai_screen_report.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
  });
}
