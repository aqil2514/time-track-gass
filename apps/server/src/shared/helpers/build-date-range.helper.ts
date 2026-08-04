import { endOfDay, startOfDay } from 'date-fns';
import { DateFilterDto } from '../dto/date-filter.dto';

export interface DateRange {
  start: Date;
  end: Date;
}

export function buildDateRange(filter: DateFilterDto): DateRange {
  if (filter.from && filter.to) {
    return {
      start: startOfDay(new Date(filter.from)),
      end: endOfDay(new Date(filter.to)),
    };
  }

  const base = new Date(filter.date ?? new Date());
  return {
    start: startOfDay(base),
    end: endOfDay(base),
  };
}
