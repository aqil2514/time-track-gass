import { Injectable } from '@nestjs/common';
import { CreateAttendanceAdjustmentDto } from 'src/app/supervisor/dto/attendance/adjustment.dto';
import { ActivityAdjusmentsDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';

@Injectable()
export class AdjustmentMapper {
  mapToDbInsert(
    raw: CreateAttendanceAdjustmentDto,
  ): ActivityAdjusmentsDbInsert[] {
    const { profile_id, adjustment, date } = raw;

    return profile_id.flatMap((userId) =>
      adjustment.map((adj) => ({
        adjusment_id: Number(adj.id),
        profile_id: userId,
        date: date,
        affected_minutes: adj.added_minutes,
      })),
    );
  }
}
