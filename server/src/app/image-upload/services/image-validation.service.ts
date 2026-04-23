import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UploadImageManualDto } from '../dto/image-upload-manual.dto';
import { createWorker } from 'tesseract.js';
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

export interface ImageWithDate {
  file: Express.Multer.File;
  date: Date;
  invalidResult?: string;
}

const MINIMUM_IMAGES = 8;

@Injectable()
export class ImageValidationService {
  constructor(private readonly analyzerService: AnalyzerService) {}

  private async getTimeAndDate(
    image: Buffer<ArrayBufferLike>,
  ): Promise<{ date: string | null; time: string | null }> {
    const result = (await this.analyzerService.callAnalyzerProvider({
      provider: 'gemini-ai',
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          text: `Extract the date and time shown in this taskbar/screenshot image.
Return ONLY a raw JSON object, no markdown, no explanation:
{"date": "YYYY-MM-DD", "time": "HH:mm"}
If date or time not found, use null for that field.`,
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: image.toString('base64'),
          },
        },
      ],
    })) as GenerateContentResponse;

    console.log(result)

    try {
      const text = result.text;
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return { date: null, time: null };
    }
  }

  private async adjustImage(file: Express.Multer.File, os: string) {
    const image = sharp(file.buffer);
    const { width, height } = await image.metadata();

    if (!width || !height) throw new Error('Gagal membaca metadata gambar');

    const cropWidth = Math.max(Math.floor(width * 0.15), 200);
    const cropHeight = Math.max(Math.floor(height * 0.08), 80);

    let extractOptions: sharp.Region;

    if (os.toLowerCase() === 'macos') {
      extractOptions = {
        left: width - cropWidth,
        top: 0,
        width: cropWidth,
        height: cropHeight,
      };
    } else {
      extractOptions = {
        left: width - cropWidth,
        top: height - cropHeight,
        width: cropWidth,
        height: cropHeight,
      };
    }

    return await image
      .extract(extractOptions)
      .resize(1200)
      .greyscale()
      .normalize()
      .threshold(128)
      .toBuffer();
  }

  private isValidImageBuffer(buffer: Buffer): boolean {
    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    return isJpeg || isPng;
  }

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
      const hash = createHash('md5').update(image.buffer).digest('hex');
      if (usedHashes.has(hash)) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Gambar ini sudah diunggah (Duplikat)',
        });
        continue;
      }
      usedHashes.add(hash);

      // 2. Cek ukuran file
      if (image.size > 5 * 1024 * 1024) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Ukuran gambar melebihi 5MB',
        });
        continue;
      }

      // 3. Cek format file
      if (!this.isValidImageBuffer(image.buffer)) {
        invalidImages.push({
          file: image,
          date: localDate,
          invalidResult: 'Format gambar harus JPEG atau PNG',
        });
        continue;
      }

      try {
        const adjustedImage = await this.adjustImage(image, os);
        const aiResult = await this.getTimeAndDate(adjustedImage);

        // 4. Cek jam terbaca
        if (!aiResult.time) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: 'Jam sistem tidak terbaca',
          });
          continue;
        }

        // 5. Cek tanggal terbaca
        if (!aiResult.date) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: 'Tanggal tidak terbaca',
          });
          continue;
        }

        // 6. Cek tanggal sesuai hari ini
        if (aiResult.date !== todayString) {
          invalidImages.push({
            file: image,
            date: localDate,
            invalidResult: `Tanggal gambar (${aiResult.date}) tidak sesuai hari ini (${todayString})`,
          });
          continue;
        }

        // 7. Cek jam sesuai slot
        const combinedDateTime = parse(
          `${todayString} ${aiResult.time}`,
          'yyyy-MM-dd HH:mm',
          localDate,
        );
        const localDateTime = toZonedTime(combinedDateTime, TIMEZONE);

        if (slotId === localDateTime.getHours()) {
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
