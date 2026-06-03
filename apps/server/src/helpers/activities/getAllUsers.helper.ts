import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAllUsers(prisma: PrismaService): Promise<string[]> {
  const data = await prisma.profiles.findMany({ select: { id: true } });
  return data.map((d) => d.id);
}
