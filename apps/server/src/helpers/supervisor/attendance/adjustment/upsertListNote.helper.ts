import { PrismaService } from 'src/services/prisma/prisma.service';
import { ActivityAdjusmentListDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusment-list.interface';

export async function upsertListNoteMany(
  prisma: PrismaService,
  payload: ActivityAdjusmentListDbInsert[],
): Promise<{ id: number; name: string }[]> {
  const results: { id: number; name: string }[] = [];

  for (const item of payload) {
    const existing = await prisma.activity_adjustment_lists.findFirst({
      where: { name: item.name },
      select: { id: true, name: true },
    });

    if (existing) {
      results.push({ id: Number(existing.id), name: existing.name });
    } else {
      const created = await prisma.activity_adjustment_lists.create({
        data: item as any,
        select: { id: true, name: true },
      });
      results.push({ id: Number(created.id), name: created.name });
    }
  }

  return results;
}

export async function upsertListNoteSingle(
  prisma: PrismaService,
  payload: ActivityAdjusmentListDbInsert,
): Promise<number> {
  const existing = await prisma.activity_adjustment_lists.findFirst({
    where: { name: payload.name },
    select: { id: true },
  });

  if (existing) return Number(existing.id);

  const created = await prisma.activity_adjustment_lists.create({
    data: payload as any,
    select: { id: true },
  });

  return Number(created.id);
}
