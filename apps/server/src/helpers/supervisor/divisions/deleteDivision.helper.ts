import { PrismaService } from 'src/services/prisma/prisma.service';

export async function deleteDivision(
  prisma: PrismaService,
  id: string,
): Promise<void> {
  await prisma.divisions.update({
    where: { id: Number(id) },
    data: { deleted_at: new Date() },
  });
}
