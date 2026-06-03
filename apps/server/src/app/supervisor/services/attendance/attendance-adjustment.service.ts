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
    const { s3_key } = await this.helper.getAttendanceById(adjustmentId);
    await Promise.all([
      this.helper.deleteAdjustmentById(adjustmentId),
      this.helper.deleteAdjustmentImage(s3_key),
    ]);
  }

  async updateAttendanceAdjustment(
    oldId: string,
    payload: UpdateAttendanceAdjustmentDto,
    image: Express.Multer.File,
  ) {
    const isNewList = payload.id === '-1';
    const isChangeImage = !!image;
    const isDeleteImage = !image && !payload.exist_image;

    let oldS3Key = '';

    if (isChangeImage) {
      const [oldData, newS3Key] = await Promise.all([
        this.helper.getAttendanceById(oldId),
        this.helper.uploadToS3(image),
      ]);
      payload.image = newS3Key;
      oldS3Key = oldData.s3_key;
    }

    if (isDeleteImage) {
      const oldData = await this.helper.getAttendanceById(oldId);
      oldS3Key = oldData.s3_key;
      payload.image = null;
    }

    if (isNewList) {
      const mappedListnote = this.helper.mapEditToListNoteDb(payload);
      const newListNoteId =
        await this.helper.createNewListnoteSingle(mappedListnote);
      const newPayload: UpdateAttendanceAdjustmentDto = {
        ...payload,
        id: String(newListNoteId),
      };
      await this.helper.updateListById(oldId, newPayload);
    } else {
      await this.helper.updateListById(oldId, payload);
    }

    if (oldS3Key) {
      await this.helper.deleteAdjustmentImage(oldS3Key);
    }
  }

  async getAttendanceById(attendanceId: string) {
    const rawData = await this.helper.getAttendanceById(attendanceId);
    const image_url = await this.helper.getAdjustmentImage(rawData.s3_key);
    const mappedData = { ...rawData, s3_key: image_url };

    return mappedData;
  }
}
