import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { CreateListNoteDto } from '../../dto/attendance/create-list-note.dto';
import { TableName } from 'src/services/supabase/supabase.interface';

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
}
