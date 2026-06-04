import { PrismaService } from 'src/services/prisma/prisma.service';
import { ActivityAdjusmentListDb } from 'src/app/supervisor/interfaces/attendances/activity-adjusment-list.interface';

export async function getAllListNotes(
  prisma: PrismaService,
): Promise<ActivityAdjusmentListDb[]> {
  const data = await prisma.activity_adjustment_lists.findMany({
    where: { deleted_at: null },
  });

  return data.map((d) => ({ ...d, id: Number(d.id) })) as unknown as ActivityAdjusmentListDb[];
}
