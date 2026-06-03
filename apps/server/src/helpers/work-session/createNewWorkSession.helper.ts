import { PrismaService } from 'src/services/prisma/prisma.service';
import { LogService } from 'src/app/log/log.service';

export async function getActiveWorkSession(prisma: PrismaService, userId: string) {
  return await prisma.work_sessions.findFirst({
    where: { user_id: userId, end_at: null },
  });
}

export async function logActiveSessionWarning(logService: LogService, userId: string): Promise<void> {
  await logService.createNewLog(userId, {
    context: 'Fungsi buat sesi jam kerja baru (createNewWorkSession)',
    level: 'WARN',
    message: `Sesi kerja yang aktif untuk user ${userId} tersebut masih ada`,
    metadata: {},
    os: 'server',
  });
}

export async function insertWorkSession(prisma: PrismaService, userId: string): Promise<void> {
  await prisma.work_sessions.create({
    data: {
      user_id: userId,
      start_at: new Date(),
    },
  });
}
