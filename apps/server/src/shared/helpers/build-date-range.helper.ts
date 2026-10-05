import { DateFilterDto } from '../dto/date-filter.dto';

export interface DateRange {
  start: Date;
  end: Date;
}

// Keep in sync with APP_TIMEZONE in dailySummary.helper.ts / dailySummaryPerCategory.helper.ts —
// daily_summary(_per_categories).date is a plain SQL `date` column. Prisma writes it from a
// date-only string (e.g. "2026-10-03"), which JS parses as UTC midnight, and Postgres casts the
// column back to timestamptz using UTC (the DB session timezone) when comparing — not the app's
// Asia/Jakarta offset. So day boundaries for querying it must also be plain UTC midnight-to-
// midnight for that same calendar-day key, not a +07:00-shifted range (that overlaps two UTC
// calendar days and silently pulls in the adjacent day's rows).
const APP_TIMEZONE = 'Asia/Jakarta';

function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function dayBoundsUtc(dateKey: string): DateRange {
  return {
    start: new Date(`${dateKey}T00:00:00.000Z`),
    end: new Date(`${dateKey}T23:59:59.999Z`),
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
