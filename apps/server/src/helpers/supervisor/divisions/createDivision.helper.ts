import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDivisionDto } from 'src/app/supervisor/_dto/create-division.dto';

export async function createDivision(
  prisma: PrismaService,
  payload: CreateDivisionDto,
): Promise<void> {
  await prisma.divisions.create({ data: payload as any });
}
