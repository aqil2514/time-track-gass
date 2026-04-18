import { Injectable } from '@nestjs/common';
import {
  CreateAttendanceAdjustmentDto,
  UpdateAttendanceAdjustmentDto,
} from '../../dto/attendance/adjustment.dto';
import { AdjustmentHelper } from './helpers/adjusment-helper.service';
import 'multer';

@Injectable()
export class AttendanceAdjustmentService {
  constructor(private readonly helper: AdjustmentHelper) {}

  async createNewAdjusment(
    payload: CreateAttendanceAdjustmentDto,
    files: Array<Express.Multer.File>,
  ) {
    const imageUrls: Record<string, string> = {};

    for (const file of files) {
      const s3Key = await this.helper.uploadToS3(file);
      imageUrls[file.fieldname] = s3Key;
    }

    payload.adjustment = payload.adjustment.map((adj, index) => ({
      ...adj,
      image: imageUrls[`adjustment[${index}][image]`] ?? null,
    }));

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

  async getAdjustmentContentByDateRange(from: string, end: string) {
    const [adjustmentContent] = await Promise.all([
      this.helper.getAttendanceAdjustmentByDateRange(from, end),
    ]);

    return { adjustmentContent };
  }

  async deleteAdjustmentById(adjustmentId: string) {
    return await this.helper.deleteAdjustmentById(adjustmentId);
  }

  async updateAttendanceAdjustment(
    oldId: string,
    payload: UpdateAttendanceAdjustmentDto,
  ) {
    const isNewList = payload.id === '-1';
    if (isNewList) {
      const mappedListnote = this.helper.mapEditToListNoteDb(payload);
      const newListNoteId =
        await this.helper.createNewListnoteSingle(mappedListnote);
      const newPayload: UpdateAttendanceAdjustmentDto = {
        ...payload,
        id: String(newListNoteId),
      };

      return await this.helper.updateListById(oldId, newPayload);
    }
    return await this.helper.updateListById(oldId, payload);
  }

  async getAttendanceById(attendanceId: string) {
    const rawData = await this.helper.getAttendanceById(attendanceId);
    const image_url = await this.helper.getAdjustmentImage(rawData.s3_key);
    const mappedData = { ...rawData, s3_key: image_url };

    return mappedData;
  }
}
