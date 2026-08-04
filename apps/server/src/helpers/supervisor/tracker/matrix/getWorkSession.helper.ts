import { PrismaService } from 'src/services/prisma/prisma.service';
import { WorkSessionDb } from 'src/app/activities/interface/work_session.interface';

export async function getWorkSession(
  prisma: PrismaService,
  date: string,
): Promise<WorkSessionDb[]> {
  const dateOnly = date.slice(0, 10);

  const start = new Date(`${dateOnly}T00:00:00+07:00`);
  const end = new Date(`${dateOnly}T23:59:59.999+07:00`);

  const data = await prisma.work_sessions.findMany({
    where: {
      OR: [
        { start_at: { gte: start, lte: end } },
        { end_at: { gte: start, lte: end } },
      ],
    },
  });

  return data.map((row) => ({
    ...row,
    id: Number(row.id),
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    start_at: (row.start_at as any)?.toISOString?.() ?? row.start_at,
    end_at: (row.end_at as any)?.toISOString?.() ?? row.end_at,
  })) as unknown as WorkSessionDb[];
}
