import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UploadImageManualDto } from '../dto/image-upload-manual.dto';
import sharp from 'sharp';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { compareAsc } from 'date-fns/compareAsc';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { createHash } from 'crypto';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from 'src/constants/timezone';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { GenerateContentResponse } from '@google/genai';
import {
  isDuplicateImage,
  isReadableDate,
  isReadableHour,
  isSameDay,
  isSameHour,
  isValidImageBuffer,
  isValidSize,
  parseLocalDateTime,
} from './image-validation/image-validation.helper';
import {
  adjustImage,
  extractDateTime,
} from './image-validation/image-validation.processor';

export interface ImageWithDate {
  file: Express.Multer.File;
  date: Date;
  invalidResult?: string;
}

const MINIMUM_IMAGES = 8;

@Injectable()
export class ImageValidationService {
  constructor(private readonly analyzerService: AnalyzerService) {}

  private async mapToImageWithDate(
    images: Array<Express.Multer.File>,
    os: string,
    slotId: number,
    invalidImages: ImageWithDate[],
    date: string,
  ) {
    const usedHashes = new Set<string>();
    const sortedResults: ImageWithDate[] = [];
    const localDate = toZonedTime(new Date(date), TIMEZONE);
    const todayString = format(localDate, 'yyyy-MM-dd');

    for (const image of images) {
      // 1. Cek duplikat
      if (isDuplicateImage(usedHashes, image)) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Gambar ini sudah diunggah (Duplikat)',
        });
        continue;
      }

      // 2. Cek ukuran file
      if (!isValidSize(image)) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Ukuran gambar melebihi 5MB',
        });
        continue;
      }

      // 3. Cek format file
      if (!isValidImageBuffer(image.buffer)) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Format gambar harus JPEG atau PNG',
        });
        continue;
      }

      try {
        const adjustedImage = await adjustImage(image, os);
        const aiResult = await extractDateTime(
          adjustedImage,
          this.analyzerService,
        );

        // 4. Cek jam terbaca
        if (!isReadableHour(aiResult)) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: 'Jam sistem tidak terbaca',
          });
          continue;
        }

        // 5. Cek tanggal terbaca
        if (!isReadableDate(aiResult)) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: 'Tanggal tidak terbaca',
          });
          continue;
        }

        // 6. Cek tanggal sesuai hari ini
        if (!isSameDay(aiResult, todayString)) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: `Tanggal gambar (${aiResult.date}) tidak sesuai hari ini (${todayString})`,
          });
          continue;
        }

        const localDateTime = parseLocalDateTime(todayString, aiResult, localDate);

        // 7. Cek jam sesuai slot
        if (isSameHour(localDateTime, slotId)) {
          sortedResults.push({ file: image, date: localDateTime });
        } else {
          invalidImages.push({
            file: image,
            date: localDateTime,
            invalidResult: `Jam di gambar (${aiResult.time}) tidak sesuai slot ${slotId}`,
          });
        }
      } catch (e) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Gagal memproses gambar',
        });
      }
    }

    sortedResults.sort((a, b) => compareAsc(a.date, b.date));
    return { sortedResults, invalidImages };
  }

  private validateInterval(
    images: ImageWithDate[],
    invalidImages: ImageWithDate[],
  ) {
    const validImages: ImageWithDate[] = [];

    if (images.length === 0) return { validImages, invalidImages };

    validImages.push(images[0]);

    for (let i = 1; i < images.length; i++) {
      const lastValid = validImages[validImages.length - 1];
      const diff = differenceInMinutes(images[i].date, lastValid.date);

      if (diff < 5) {
        invalidImages.push({
          ...images[i],
          invalidResult: 'Minimal waktu antar gambar adalah 5 menit.',
        });
      } else {
        validImages.push(images[i]);
      }
    }

    return { validImages, invalidImages };
  }

  async validateImage(
    images: Array<Express.Multer.File>,
    body: UploadImageManualDto,
    date: string,
  ) {
    if (images.length < MINIMUM_IMAGES) {
      throw new HttpException(
        { message: `Minimal upload ${MINIMUM_IMAGES} gambar per slot` },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const invalidImages: ImageWithDate[] = [];

    const { sortedResults } = await this.mapToImageWithDate(
      images,
      body.os,
      body.slotId,
      invalidImages,
      date,
    );

    const { validImages, invalidImages: finalInvalid } = this.validateInterval(
      sortedResults,
      invalidImages,
    );

    return { validImages, invalidImages: finalInvalid };
  }
}
