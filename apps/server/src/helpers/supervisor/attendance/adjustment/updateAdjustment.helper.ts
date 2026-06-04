import { PrismaService } from 'src/services/prisma/prisma.service';
import { UpdateAttendanceAdjustmentDto } from 'src/app/supervisor/dto/attendance/adjustment.dto';

export async function updateAdjustment(
  prisma: PrismaService,
  oldId: string,
  payload: UpdateAttendanceAdjustmentDto,
): Promise<void> {
  await prisma.activity_adjustments.update({
    where: { id: BigInt(oldId) },
    data: {
      adjusment_id: payload.id ? BigInt(payload.id) : null,
      date: new Date(payload.date),
      affected_minutes: payload.added_minutes,
      s3_key: payload.image,
    },
  });
}
