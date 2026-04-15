import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  setMonth,
  setYear,
  format,
  startOfDay,
  isWithinInterval,
} from 'date-fns';

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
      // parseISO dan startOfDay memastikan kita mulai dari jam 00:00:00
      const current = startOfDay(parseISO(obj.date));
      const result = startOfWeek(current, { weekStartsOn: 1 });
      return format(result, 'yyyy-MM-dd');
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
      const current = startOfDay(parseISO(obj.date));
      const result = endOfWeek(current, { weekStartsOn: 1 });
      return format(result, 'yyyy-MM-dd');
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
    const today = startOfDay(new Date());
    let startDate: Date;
    let endDate: Date;

    if (obj.mode === 'weekly' && obj.date) {
      const current = startOfDay(parseISO(obj.date));
      startDate = startOfWeek(current, { weekStartsOn: 1 });
      endDate = endOfWeek(current, { weekStartsOn: 1 });
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
