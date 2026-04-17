import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import {
  CreateAttendanceAdjustmentDto,
  UpdateAttendanceAdjustmentDto,
} from 'src/app/supervisor/dto/attendance/adjustment.dto';
import { ActivityAdjusmentsDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusments.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ActivityAdjusmentListDbInsert } from 'src/app/supervisor/interfaces/attendances/activity-adjusment-list.interface';

@Injectable()
export class AdjustmentHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  mapToAdjustmentDb(raw: CreateAttendanceAdjustmentDto) {
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

    return Array.from(
      new Map(mapped.map((item) => [item.name, item])).values(),
    );
  }

  mapEditToListNoteDb(
    payload: UpdateAttendanceAdjustmentDto,
  ): ActivityAdjusmentListDbInsert {
    return {
      added_minutes: payload.added_minutes,
      name: payload.adjusment_name,
      notes: `Ditambahkan secara otomatis melalui Ringkasan Absen pada ${payload.date}`,
    };
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

  async createNewListnoteSingle(
    payload: ActivityAdjusmentListDbInsert,
  ): Promise<number> {
    const { error, data } = await this.supabase
      .from(TableName.ActivityAdjusmentList)
      .upsert(payload, {
        onConflict: 'name',
        ignoreDuplicates: false,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Error Upsert Listnote:', error);
      throw error;
    }

    return data.id;
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

  async getAttendanceAdjustmentByDateRange(startDate: string, endDate: string) {
    const { error, data } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .select(
        'id, date, affected_minutes, profile:profile_id(id, full_name, username, division), adjustment:adjusment_id(id, name, notes)',
      )
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    return data;
  }

  async deleteAdjustmentById(adjustmentId: string) {
    const { error } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .delete()
      .eq('id', adjustmentId);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async updateListById(oldId: string, payload: UpdateAttendanceAdjustmentDto) {
    const { error } = await this.supabase
      .from(TableName.ActivityAdjusments)
      .update({
        adjusment_id: Number(payload.id),
        date: payload.date,
        affected_minutes: payload.added_minutes,
      })
      .eq('id', oldId);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
