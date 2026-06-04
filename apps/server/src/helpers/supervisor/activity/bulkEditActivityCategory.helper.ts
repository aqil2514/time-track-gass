import { PrismaService } from 'src/services/prisma/prisma.service';

export async function bulkEditActivityCategory(
  prisma: PrismaService,
  activityIds: string[],
  newCategory: string,
): Promise<void> {
  await prisma.ai_screen_report.updateMany({
    where: { id: { in: activityIds } },
    data: { category: newCategory },
  });
}
