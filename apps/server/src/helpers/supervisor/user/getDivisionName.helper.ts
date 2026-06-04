import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getDivisionName(
  prisma: PrismaService,
  divisionId: string,
): Promise<string | null> {
  const data = await prisma.divisions.findUnique({
    where: { id: BigInt(divisionId) },
    select: { name: true },
  });

  return data?.name ?? null;
}
