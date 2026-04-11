import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { CreateListNoteDto } from '../../dto/attendance/create-list-note.dto';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ActivityAdjusmentListDb } from '../../interfaces/attendances/activity-adjusment-list.interface';

@Injectable()
export class AttendanceListnoteService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async createNewAttendance(body: CreateListNoteDto) {
    const { error } = await this.supabase
      .from(TableName.ActivityAdjusmentList)
      .insert(body);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async getAttendanceListNotes(): Promise<ActivityAdjusmentListDb[]> {
    const { data, error } = await this.supabase
      .from(TableName.ActivityAdjusmentList)
      .select('*')
      .is('deleted_at', null);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async editAttendanceListNotes(oldId: string, body: CreateListNoteDto) {
    const { error } = await this.supabase
      .from(TableName.ActivityAdjusmentList)
      .update(body)
      .eq('id', oldId);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
