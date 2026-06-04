import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDivisionDto } from 'src/app/supervisor/_dto/create-division.dto';

export async function editDivision(
  prisma: PrismaService,
  payload: CreateDivisionDto,
  id: string,
): Promise<void> {
  await prisma.divisions.update({
    where: { id: Number(id) },
    data: payload as any,
  });
}
