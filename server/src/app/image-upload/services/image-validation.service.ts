import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UploadImageManualDto } from '../dto/image-upload-manual.dto';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { compareAsc } from 'date-fns/compareAsc';
import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { createHash } from 'crypto';

export interface ImageWithDate {
  file: Express.Multer.File;
  date: Date;
  invalidResult?: string;
}

const MINIMUM_IMAGES = 8;

@Injectable()
export class ImageValidationService {
  private async adjustImage(file: Express.Multer.File, os: string) {
    const image = sharp(file.buffer);
    const { width, height } = await image.metadata();

    if (!width || !height) throw new Error('Gagal membaca metadata gambar');

    const cropWidth = Math.floor(width * 0.15);
    const cropHeight = Math.floor(height * 0.08);

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
      .threshold(128)
      .toBuffer();
  }

  private async getDateTimeSystem(image: Buffer<ArrayBufferLike>) {
    const worker = await createWorker('eng');

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789:./- ',
    });

    const ret = await worker.recognize(image);
    await worker.terminate();

    const text = ret.data.text;

    const timeMatch = text.match(/([01]?\d|2[0-3])[:.][0-5]\d/);
    const time = timeMatch ? timeMatch[0].replace('.', ':') : null;

    return { time };
  }

  private async mapToImageWithDate(
    images: Array<Express.Multer.File>,
    os: string,
    slotId: number,
    invalidImages: ImageWithDate[],
  ) {
    const worker = await createWorker('eng'); // Init di luar loop
    await worker.setParameters({ tessedit_char_whitelist: '0123456789:./- ' });

    const usedHashes = new Set<string>(); // Untuk deteksi duplikat
    const sortedResults: ImageWithDate[] = [];
    const todayString = format(new Date(), 'yyyy-MM-dd');

    for (const image of images) {
      const hash = createHash('md5').update(image.buffer).digest('hex');
      if (usedHashes.has(hash)) {
        invalidImages.push({
          file: image,
          date: new Date(),
          invalidResult: 'Gambar ini sudah diunggah (Duplikat)',
        });
        continue;
      }
      usedHashes.add(hash);

      try {
        const adjustedImage = await this.adjustImage(image, os);
        const ret = await worker.recognize(adjustedImage);

        const text = ret.data.text;
        const timeMatch = text.match(/([01]?\d|2[0-3])[:.][0-5]\d/);
        const time = timeMatch ? timeMatch[0].replace('.', ':') : null;

        if (!time) {
          invalidImages.push({
            file: image,
            date: new Date(),
            invalidResult: 'Jam sistem tidak terbaca',
          });
          continue;
        }

        const combinedDateTime = parse(
          `${todayString} ${time}`,
          'yyyy-MM-dd HH:mm',
          new Date(),
        );

        if (slotId === combinedDateTime.getHours()) {
          sortedResults.push({ file: image, date: combinedDateTime });
        } else {
          invalidImages.push({
            file: image,
            date: combinedDateTime,
            invalidResult: `Jam di gambar (${time}) tidak sesuai slot ${slotId}`,
          });
        }
      } catch (e) {
        invalidImages.push({
          file: image,
          date: new Date(),
          invalidResult: 'Gagal memproses gambar',
        });
      }
    }

    await worker.terminate();
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
    userId: string,
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
    );

    return this.validateInterval(sortedResults, invalidImages);
  }
}
