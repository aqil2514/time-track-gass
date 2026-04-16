import { Injectable } from '@nestjs/common';
import { CreateAttendanceAdjustmentDto } from '../../dto/attendance/adjustment.dto';
import { AdjustmentHelper } from './helpers/adjusment-helper.service';

@Injectable()
export class AttendanceAdjustmentService {
  constructor(private readonly helper: AdjustmentHelper) {}

  async createNewAdjusment(payload: CreateAttendanceAdjustmentDto) {
    const newListNote = payload.adjustment.filter((adj) => adj.id === '-1');

    if (newListNote.length === 0) {
      const mappedData = this.helper.mapToAdjustmentDb(payload);
      return await this.helper.createNewAdjustment(mappedData);
    }

    const mappedListnote = this.helper.mapToListNoteDb(payload);
    const newListNoteId = await this.helper.createNewListnote(mappedListnote);
    const mappedData = this.helper.mapNewListNoteToAdjustmentDb(
      payload,
      newListNoteId,
    );

    await this.helper.createNewAdjustment(mappedData);
  }
}
