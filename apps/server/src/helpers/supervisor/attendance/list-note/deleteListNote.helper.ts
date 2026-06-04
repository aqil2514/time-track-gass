import { PrismaService } from 'src/services/prisma/prisma.service';

export async function deleteListNote(
  prisma: PrismaService,
  listId: string,
): Promise<void> {
  await prisma.activity_adjustment_lists.update({
    where: { id: BigInt(listId) },
    data: { deleted_at: new Date() },
  });
}
