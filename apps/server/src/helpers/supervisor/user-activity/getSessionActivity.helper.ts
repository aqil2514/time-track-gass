import { PrismaService } from 'src/services/prisma/prisma.service';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';
import { DateFilterDto } from 'src/shared/dto/date-filter.dto';
import { PaginatedResponse } from 'src/shared/interfaces/paginated-response.interface';

const DEFAULT_LIMIT = 20;

function buildRange(filter: DateFilterDto): { start: Date; end: Date } {
  if (filter.from && filter.to) {
    return {
      start: new Date(`${filter.from.slice(0, 10)}T00:00:00+07:00`),
      end: new Date(`${filter.to.slice(0, 10)}T23:59:59+07:00`),
    };
  }
  const d = (filter.date ?? new Date().toISOString()).slice(0, 10);
  return {
    start: new Date(`${d}T00:00:00+07:00`),
    end: new Date(`${d}T23:59:59+07:00`),
  };
}

function mapRow(row: any): SessionSummaryDb {
  return {
    ...row,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    session_start: row.session_start?.toISOString?.() ?? row.session_start,
    session_end: row.session_end?.toISOString?.() ?? row.session_end,
  };
}

export async function getSessionActivity(
  prisma: PrismaService,
  userId: string,
  filter: DateFilterDto,
  page = 1,
  limit = DEFAULT_LIMIT,
): Promise<PaginatedResponse<SessionSummaryDb>> {
  const { start, end } = buildRange(filter);

  const where = {
    user_id: userId,
    session_start: { gte: start, lte: end },
  };

  const [total, rows] = await Promise.all([
    prisma.session_summary.count({ where }),
    prisma.session_summary.findMany({
      where,
      orderBy: { session_start: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
