import { PrismaService } from 'src/services/prisma/prisma.service';
import { DivisionsDb } from 'src/app/supervisor/_interfaces/divisions.interface';

export async function getAllDivisions(prisma: PrismaService): Promise<DivisionsDb[]> {
  const data = await prisma.divisions.findMany({
    where: { deleted_at: null },
    orderBy: { name: 'asc' },
  });

  return data.map((d) => ({ ...d, id: Number(d.id) })) as unknown as DivisionsDb[];
}
