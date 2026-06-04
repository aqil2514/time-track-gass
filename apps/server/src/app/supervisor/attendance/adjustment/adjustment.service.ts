import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  CreateAttendanceAdjustmentDto,
  UpdateAttendanceAdjustmentDto,
} from '../../dto/attendance/adjustment.dto';
import { ActivityAdjusmentListDbInsert } from '../../interfaces/attendances/activity-adjusment-list.interface';
import { uploadAdjustmentToS3 } from 'src/helpers/supervisor/attendance/adjustment/uploadAdjustmentToS3.helper';
import { getAdjustmentByDateRange } from 'src/helpers/supervisor/attendance/adjustment/getAdjustmentByDateRange.helper';
import { getAdjustmentById } from 'src/helpers/supervisor/attendance/adjustment/getAdjustmentById.helper';
import { createAdjustment } from 'src/helpers/supervisor/attendance/adjustment/createAdjustment.helper';
import { upsertListNoteMany, upsertListNoteSingle } from 'src/helpers/supervisor/attendance/adjustment/upsertListNote.helper';
import { updateAdjustment } from 'src/helpers/supervisor/attendance/adjustment/updateAdjustment.helper';
import { deleteAdjustment } from 'src/helpers/supervisor/attendance/adjustment/deleteAdjustment.helper';
import { getAdjustmentImage } from 'src/helpers/supervisor/attendance/adjustment/getAdjustmentImage.helper';

@Injectable()
export class AdjustmentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('AWS_S3_CLIENT') private readonly s3Client: S3Client,
  ) {}

  async create(payload: CreateAttendanceAdjustmentDto, files: Express.Multer.File[]) {
    // Step 1: Upload semua file ke S3
    const imageUrls: Record<string, string> = {};
    for (const file of files) {
      imageUrls[file.fieldname] = await uploadAdjustmentToS3(this.s3Client, file);
    }

    payload.adjustment = payload.adjustment.map((adj, index) => ({
      ...adj,
      image: imageUrls[`adjustment[${index}][image]`] ?? null,
    }));

    const hasNewListNote = payload.adjustment.some((adj) => adj.id === '-1');

    if (!hasNewListNote) {
      // Step 2a: Buat adjustment langsung
      const mappedData = payload.profile_id.flatMap((userId) =>
        payload.adjustment.map((adj) => ({
          adjusment_id: Number(adj.id),
          profile_id: userId,
          date: payload.date,
          s3_key: adj.image,
          affected_minutes: adj.added_minutes,
        })),
      );
      return createAdjustment(this.prisma, mappedData);
    }

    // Step 2b: Upsert list note baru terlebih dahulu
    const newItems = payload.adjustment.filter((adj) => adj.id === '-1');
    const uniqueListNotes: ActivityAdjusmentListDbInsert[] = Array.from(
      new Map(
        newItems.map((adj) => [
          adj.adjusment_name?.trim() ?? 'No Name',
          {
            added_minutes: adj.added_minutes,
            name: adj.adjusment_name?.trim() ?? 'No Name',
            notes: `Ditambahkan secara otomatis melalui Ringkasan Absen pada ${payload.date}`,
          },
        ]),
      ).values(),
    );
    const newListNotes = await upsertListNoteMany(this.prisma, uniqueListNotes);

    // Step 3: Buat adjustment dengan ID list note baru
    const mappedData = payload.profile_id.flatMap((userId) =>
      payload.adjustment.map((adj) => {
        const finalId =
          adj.id === '-1'
            ? newListNotes.find((n) => n.name === adj.adjusment_name)?.id ?? -1
            : Number(adj.id);
        return {
          adjusment_id: finalId,
          profile_id: userId,
          date: payload.date,
          s3_key: adj.image,
          affected_minutes: adj.added_minutes,
        };
      }),
    );
    return createAdjustment(this.prisma, mappedData);
  }

  async getByDateRange(startDate: string, endDate: string) {
    // Step 1: Ambil adjustment berdasarkan rentang tanggal
    const adjustmentContent = await getAdjustmentByDateRange(this.prisma, startDate, endDate);
    return { adjustmentContent };
  }

  async getById(adjustmentId: string) {
    // Step 1: Ambil data adjustment by ID
    const rawData = await getAdjustmentById(this.prisma, adjustmentId);
    // Step 2: Generate signed URL untuk image
    const image_url = await getAdjustmentImage(this.s3Client, rawData?.s3_key);
    return { ...rawData, s3_key: image_url };
  }

  async delete(adjustmentId: string) {
    // Step 1: Ambil s3_key lalu hapus dari DB dan S3
    const data = await getAdjustmentById(this.prisma, adjustmentId);
    return deleteAdjustment(this.prisma, this.s3Client, adjustmentId, data?.s3_key);
  }

  async update(oldId: string, payload: UpdateAttendanceAdjustmentDto, image: Express.Multer.File) {
    const isNewList = payload.id === '-1';
    const isChangeImage = !!image;
    const isDeleteImage = !image && !payload.exist_image;

    let oldS3Key = '';

    // Step 1: Handle perubahan image
    if (isChangeImage) {
      const [oldData, newS3Key] = await Promise.all([
        getAdjustmentById(this.prisma, oldId),
        uploadAdjustmentToS3(this.s3Client, image),
      ]);
      payload.image = newS3Key;
      oldS3Key = oldData?.s3_key;
    }

    if (isDeleteImage) {
      const oldData = await getAdjustmentById(this.prisma, oldId);
      oldS3Key = oldData?.s3_key;
      payload.image = null;
    }

    // Step 2: Handle list note baru jika diperlukan
    if (isNewList) {
      const newListNoteId = await upsertListNoteSingle(this.prisma, {
        added_minutes: payload.added_minutes,
        name: payload.adjusment_name,
        notes: `Ditambahkan secara otomatis melalui Ringkasan Absen pada ${payload.date}`,
      });
      payload = { ...payload, id: String(newListNoteId) };
    }

    // Step 3: Update data adjustment di DB
    await updateAdjustment(this.prisma, oldId, payload);

    // Step 4: Hapus image lama dari S3 jika ada
    if (oldS3Key) {
      try {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        await this.s3Client.send(new DeleteObjectCommand({ Bucket: 'tracker', Key: oldS3Key }));
      } catch (err) {
        console.error('Gagal menghapus file lama dari S3:', err);
      }
    }
  }
}
