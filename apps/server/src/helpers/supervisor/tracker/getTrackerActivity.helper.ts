import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { PaginatedResponse } from 'src/shared/interfaces/paginated-response.interface';

const DEFAULT_LIMIT = 50;

export async function getTrackerActivity(
  prisma: PrismaService,
  username: string,
  date: string | undefined,
  page = 1,
  limit = DEFAULT_LIMIT,
  from?: string,
  to?: string,
): Promise<PaginatedResponse<ReturnType<typeof mapRow>>> {
  const user = await prisma.profiles.findFirst({
    where: { username, deleted_at: null },
    select: { id: true },
  });

  if (!user) throw new NotFoundException('User not found');

  let start: Date;
  let end: Date;

  if (from && to) {
    start = new Date(`${from.slice(0, 10)}T00:00:00+07:00`);
    end = new Date(`${to.slice(0, 10)}T23:59:59+07:00`);
  } else if (date) {
    const dateOnly = date.slice(0, 10);
    start = new Date(`${dateOnly}T00:00:00+07:00`);
    end = new Date(`${dateOnly}T23:59:59+07:00`);
  } else {
    throw new NotFoundException('Date or from/to is required');
  }

  const where = {
    user_id: user.id,
    created_at: { gte: start, lte: end },
    deleted_at: null,
  };

  const [total, rows] = await Promise.all([
    prisma.ai_screen_report.count({ where }),
    prisma.ai_screen_report.findMany({
      where,
      orderBy: { created_at: 'desc' },
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

function mapRow(row: {
  id: string;
  created_at: Date;
  app_name: string;
  window_title: string;
  category: string;
  summary: string;
  user_id: string;
  s3_key: string;
  interval: { toNumber(): number } | null;
  deleted_at: Date | null;
}) {
  return {
    id: row.id,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    app_name: row.app_name,
    window_title: row.window_title,
    category: row.category,
    summary: row.summary,
    user_id: row.user_id,
    s3_key: row.s3_key,
    interval: Number(row.interval ?? 0),
    deleted_at: (row.deleted_at as any)?.toISOString?.() ?? row.deleted_at,
  };
}
