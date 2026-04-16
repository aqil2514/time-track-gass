import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { CreateAttendanceAdjustmentDto } from 'src/app/supervisor/dto/attendance/adjustment.dto';
import { ActivityAdjusmentsDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';
import { AdjustmentMapper } from './adjustment-mapper.service';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ActivityAdjusmentListDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusment-list.interface';

@Injectable()
export class AdjustmentHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly mapper: AdjustmentMapper,
  ) {}

  mapToAdjustmentDb(payload: CreateAttendanceAdjustmentDto) {
    const mappedDb = this.mapper.mapToDbInsert(payload);

    return mappedDb;
  }

  async createNewAdjustment(payload: ActivityAdjusmentsDbInsert[]) {
    const { error } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .insert(payload);

    if (error) {
      console.error(error);
      throw error;
    }
  }

mapToListNoteDb(
  payload: CreateAttendanceAdjustmentDto,
): ActivityAdjusmentListDbInsert[] {
  const newItems = payload.adjustment.filter((adj) => adj.id === '-1');

  const mapped = newItems.map((adj) => ({
    added_minutes: adj.added_minutes,
    name: adj.adjusment_name?.trim() ?? 'No Name',
    notes: `Ditambahkan secara otomatis melalui Ringkasan Absen pada ${payload.date}`,
  }));

  return Array.from(new Map(mapped.map(item => [item.name, item])).values());
}

  async createNewListnote(
    payload: ActivityAdjusmentListDbInsert[],
  ): Promise<{ id: number; name: string }[]> {
    const { error, data } = await this.supabase
      .from(TableName.ActivityAdjusmentList)
      .upsert(payload, {
        onConflict: 'name',
        ignoreDuplicates: false,
      })
      .select('id, name');

    if (error) {
      console.error('Error Upsert Listnote:', error);
      throw error;
    }

    return data;
  }

  mapNewListNoteToAdjustmentDb(
    raw: CreateAttendanceAdjustmentDto,
    newListNote: { id: number; name: string }[],
  ): ActivityAdjusmentsDbInsert[] {
    const { profile_id, adjustment, date } = raw;

    return profile_id.flatMap((userId) =>
      adjustment.map((adj) => {
        let finalAdjusmentId: number;

        if (adj.id === '-1') {
          const match = newListNote.find((n) => n.name === adj.adjusment_name);
          finalAdjusmentId = match ? Number(match.id) : -1;
        } else {
          finalAdjusmentId = Number(adj.id);
        }

        return {
          profile_id: userId,
          date: date,
          adjusment_id: finalAdjusmentId,
          affected_minutes: adj.added_minutes,
        };
      }),
    );
  }
}
