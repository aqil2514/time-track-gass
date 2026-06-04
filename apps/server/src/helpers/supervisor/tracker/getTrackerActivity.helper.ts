import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getTrackerActivity(
  prisma: PrismaService,
  username: string,
  date: string,
) {
  const user = await prisma.profiles.findFirst({
    where: { username, deleted_at: null },
    select: { id: true },
  });

  if (!user) throw new NotFoundException('User not found');

  const start = new Date(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = await prisma.ai_screen_report.findMany({
    where: {
      user_id: user.id,
      created_at: { gte: start, lt: end },
      deleted_at: null,
    },
    orderBy: { created_at: 'desc' },
  });

  return rows.map((row) => ({
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
  }));
}
