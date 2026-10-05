import { DateFilterDto } from '../dto/date-filter.dto';

export interface DateRange {
  start: Date;
  end: Date;
}

// Keep in sync with APP_TIMEZONE in dailySummary.helper.ts / dailySummaryPerCategory.helper.ts —
// daily_summary(_per_categories) rows are keyed by Asia/Jakarta calendar days, so reads must use
// the same timezone when computing day boundaries, not the host process's local timezone.
const APP_TIMEZONE = 'Asia/Jakarta';

function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function dayBoundsUtc(dateKey: string): DateRange {
  return {
    start: new Date(`${dateKey}T00:00:00.000+07:00`),
    end: new Date(`${dateKey}T23:59:59.999+07:00`),
  };
}

export function buildDateRange(filter: DateFilterDto): DateRange {
  if (filter.from && filter.to) {
    return {
      start: dayBoundsUtc(toDateKey(new Date(filter.from))).start,
      end: dayBoundsUtc(toDateKey(new Date(filter.to))).end,
    };
  }

  const base = new Date(filter.date ?? new Date());
  return dayBoundsUtc(toDateKey(base));
}
