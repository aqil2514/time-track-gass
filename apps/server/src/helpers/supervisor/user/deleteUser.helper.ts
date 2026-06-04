import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function deleteUser(
  prisma: PrismaService,
  eventEmitter: EventEmitter2,
  id: string,
): Promise<void> {
  await prisma.profiles.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  eventEmitter.emit('profile.deleted', id);
}
