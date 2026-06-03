import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAllDivisions(prisma: PrismaService) {
  return await prisma.divisions.findMany({
    where: { id: { notIn: [1, 8] } }, // 1 = Test, 8 = Semua Divisi
    select: { id: true, name: true },
  });
}
