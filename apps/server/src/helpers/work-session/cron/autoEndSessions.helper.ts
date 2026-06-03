import { PrismaService } from 'src/services/prisma/prisma.service';

export async function getActiveSessions(prisma: PrismaService) {
  return await prisma.work_sessions.findMany({
    where: { end_at: null },
    select: { id: true, user_id: true, start_at: true },
  });
}

export async function getLastUserActivity(
  prisma: PrismaService,
  userId: string,
  startAt: Date,
): Promise<Date | null> {
  const record = await prisma.ai_screen_report.findFirst({
    where: {
      user_id: userId,
      created_at: { gte: startAt },
    },
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });

  return record ? new Date(record.created_at) : null;
}

export async function endSessionById(
  prisma: PrismaService,
  sessionId: bigint,
  end_at?: Date,
  stop_mode?: string,
): Promise<void> {
  await prisma.work_sessions.updateMany({
    where: { id: sessionId, end_at: null },
    data: {
      end_at: end_at ?? new Date(),
      stop_mode,
    },
  });
}
