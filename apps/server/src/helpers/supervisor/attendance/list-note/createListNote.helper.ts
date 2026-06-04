import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateListNoteDto } from 'src/app/supervisor/dto/attendance/create-list-note.dto';

export async function createListNote(
  prisma: PrismaService,
  body: CreateListNoteDto,
): Promise<void> {
  await prisma.activity_adjustment_lists.create({ data: body as any });
}
