import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getAdjustmentById(
  prisma: PrismaService,
  adjustmentId: string,
) {
  const data = await prisma.activity_adjustments.findUnique({
    where: { id: BigInt(adjustmentId) },
    select: {
      s3_key: true,
      date: true,
      affected_minutes: true,
      profiles: {
        select: { full_name: true, username: true, division: true },
      },
      activity_adjustment_lists: {
        select: { id: true, name: true, notes: true },
      },
    },
  });

  if (!data) return null;

  return {
    s3_key: data.s3_key,
    date: (data.date as any)?.toISOString?.() ?? data.date,
    affected_minutes: Number(data.affected_minutes ?? 0),
    profile: data.profiles,
    adjustment: {
      id: Number(data.activity_adjustment_lists?.id ?? 0),
      name: data.activity_adjustment_lists?.name ?? '',
      notes: data.activity_adjustment_lists?.notes ?? '',
    },
  };
}
