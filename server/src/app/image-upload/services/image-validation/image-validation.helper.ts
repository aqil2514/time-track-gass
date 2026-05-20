// IMAGE VALIDASI HELPER

import { createHash } from 'crypto';
import { AIResult } from './image-validation.processor';
import { parse } from 'date-fns/parse';
import { fromZonedTime } from 'node_modules/date-fns-tz/dist/cjs';

// Step 1 : Apakah ada gambar yang duplikat?
export function isDuplicateImage(
  usedHashes: Set<string>,
  image: Express.Multer.File,
): boolean {
  const hash = createHash('md5').update(image.buffer).digest('hex');

  if (usedHashes.has(hash)) {
    console.log(
      `[isDuplicateImage] DUPLICATE detected - file: ${image.originalname}, hash: ${hash}`,
    );
    return true;
  }

  usedHashes.add(hash);
  console.log(
    `[isDuplicateImage] OK - file: ${image.originalname}, hash: ${hash}`,
  );
  return false;
}

// Step 2 : Apakah gambar lebih dari 5MB?
export function isValidSize(image: Express.Multer.File) {
  const sizeMB = (image.size / (1024 * 1024)).toFixed(2);
  const valid = image.size <= 5 * 1024 * 1024;
  console.log(
    `[isValidSize] file: ${image.originalname}, size: ${sizeMB}MB, valid: ${valid}`,
  );
  return valid;
}

// Step 3 : Apakah format file valid?
export function isValidImageBuffer(buffer: Buffer): boolean {
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  const valid = isJpeg || isPng;
  const detectedFormat = isJpeg ? 'JPEG' : isPng ? 'PNG' : 'UNKNOWN';
  console.log(
    `[isValidImageBuffer] format: ${detectedFormat}, valid: ${valid}`,
  );
  return valid;
}

// Step 4 : Apakah jam terbaca?
export function isReadableHour(aiResult: AIResult) {
  const readable = !!aiResult.time;
  console.log(
    `[isReadableHour] time: ${aiResult.time ?? 'null'}, readable: ${readable}`,
  );
  return readable;
}

// Step 5 : Apakah tanggal terbaca
export function isReadableDate(aiResult: AIResult) {
  const readable = !!aiResult.date;
  console.log(
    `[isReadableDate] date: ${aiResult.date ?? 'null'}, readable: ${readable}`,
  );
  return readable;
}

// Step 6 : Apakah tanggal sesuai dengan hari ini?
export function isSameDay(aiResult: AIResult, todayString: string) {
  const same = aiResult.date === todayString;
  console.log(
    `[isSameDay] aiDate: ${aiResult.date}, today: ${todayString}, match: ${same}`,
  );
  return same;
}

// Step 7 : Parse local datetime
export function parseLocalDateTime(
  todayString: string,
  aiResult: AIResult,
): Date {
  const localDateTimeString = `${todayString} ${aiResult.time}`;
  const result = fromZonedTime(localDateTimeString, 'Asia/Jakarta');
  console.log(
    `[parseLocalDateTime] combined: ${localDateTimeString}, result: ${result.toISOString()}`,
  );
  return result;
}

// Step 7 : Apakah jamnya sesuai dengan slot yang dikirim?
export function isSameHour(localDateTime: Date, slotId: number): boolean {
  const hour = (localDateTime.getUTCHours() + 7) % 24;
  const match = hour === slotId;
  console.log(
    `[isSameHour] imageHour: ${hour}, slotId: ${slotId}, match: ${match}`,
  );
  return match;
}
