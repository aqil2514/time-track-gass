import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateListNoteDto } from 'src/app/supervisor/_dto/attendance/create-list-note.dto';

export async function updateListNote(
  prisma: PrismaService,
  listId: string,
  body: CreateListNoteDto,
): Promise<void> {
  await prisma.activity_adjustment_lists.update({
    where: { id: BigInt(listId) },
    data: body as any,
  });
}
