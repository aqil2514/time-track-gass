import { PrismaService } from 'src/services/prisma/prisma.service';
import { ActivityAdjusmentsDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';

export async function createAdjustment(
  prisma: PrismaService,
  payload: ActivityAdjusmentsDbInsert[],
): Promise<void> {
  await prisma.activity_adjustments.createMany({
    data: payload.map((item) => ({
      adjusment_id: item.adjusment_id ? BigInt(item.adjusment_id) : null,
      profile_id: item.profile_id,
      date: new Date(item.date),
      s3_key: item.s3_key,
      affected_minutes: item.affected_minutes,
    })),
  });
}
