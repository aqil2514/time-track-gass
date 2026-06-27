import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Logger } from '@nestjs/common';
import { TIMEZONE } from 'src/constants/timezone';

const logger = new Logger('validateDateTimeAgainstSlot');

export interface DateTimeValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateDateTimeAgainstSlot(
  detectedDate: Date,
  expectedDate: string,
  slotId: number,
  source: 'gemini' | 'filename' = 'gemini',
): DateTimeValidationResult {
  const localDetected = toZonedTime(detectedDate, TIMEZONE);
  const detectedDateString = format(localDetected, 'yyyy-MM-dd');
  const detectedHour = localDetected.getHours();

  const localExpected = toZonedTime(new Date(expectedDate), TIMEZONE);
  const expectedDateString = format(localExpected, 'yyyy-MM-dd');

  logger.debug(
    `detectedDate UTC="${detectedDate.toISOString()}" -> WIB date="${detectedDateString}" hour=${detectedHour} | expectedDate="${expectedDate}" -> WIB="${expectedDateString}" | slotId=${slotId}`,
  );

  const tip = source === 'filename'
    ? ' Tips: Beri nama file dengan format YYYY-MM-DD_HH-mm-ss (contoh: 2025-06-26_08-30-00.jpg) sebagai cadangan jika sistem gagal membaca jam dari gambar.'
    : '';

  if (detectedDateString !== expectedDateString) {
    return {
      valid: false,
      reason: `Tanggal gambar (${detectedDateString}) tidak sesuai tanggal upload (${expectedDateString}). ${tip}`,
    };
  }

  if (detectedHour !== slotId) {
    return {
      valid: false,
      reason: `Jam di gambar (${detectedHour}) tidak sesuai slot ${slotId}. ${tip}`,
    };
  }

  return { valid: true };
}
