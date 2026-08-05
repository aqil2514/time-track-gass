import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import {
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
  format,
  startOfDay,
  isWithinInterval,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Jakarta';

export class AttendanceLogsQueryDto {
  @IsEnum(['weekly', 'monthly'])
  mode: 'weekly' | 'monthly';

  @IsOptional()
  date?: string;

  @IsOptional()
  month?: string;

  @IsOptional()
  year?: string;

  @Expose()
  @IsOptional()
  @Transform(({ obj }) => {
    if (obj.mode === 'weekly' && obj.date) {
      return obj.date.slice(0, 10);
    }

    if (obj.mode === 'monthly' && obj.month && obj.year) {
      const result = startOfMonth(
        new Date(parseInt(obj.year), parseInt(obj.month) - 1, 1),
      );
      return format(result, 'yyyy-MM-dd');
    }
    return null;
  })
  start: string;

  @Expose()
  @IsOptional()
  @Transform(({ obj }) => {
    if (obj.mode === 'weekly' && obj.date) {
      return format(addDays(parseISO(obj.date.slice(0, 10)), 6), 'yyyy-MM-dd');
    }

    if (obj.mode === 'monthly' && obj.month && obj.year) {
      const result = endOfMonth(
        new Date(parseInt(obj.year), parseInt(obj.month) - 1, 1),
      );
      return format(result, 'yyyy-MM-dd');
    }
    return null;
  })
  end: string;

  @Expose()
  @IsOptional()
  @Transform(({ obj }) => {
    const today = startOfDay(toZonedTime(new Date(), TIMEZONE));
    let startDate: Date;
    let endDate: Date;

    if (obj.mode === 'weekly' && obj.date) {
      startDate = parseISO(obj.date.slice(0, 10));
      endDate = addDays(startDate, 6);
    } else if (obj.mode === 'monthly' && obj.month && obj.year) {
      startDate = new Date(parseInt(obj.year), parseInt(obj.month) - 1, 1);
      endDate = endOfMonth(startDate);
    } else {
      return false;
    }

    return isWithinInterval(today, {
      start: startDate,
      end: endDate,
    });
  })
  isIncludeToday: boolean;
}
