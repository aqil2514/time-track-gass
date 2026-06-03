import { PrismaService } from 'src/services/prisma/prisma.service';
import { LogService } from 'src/app/log/log.service';

export async function logNoActiveSessionWarning(logService: LogService, userId: string): Promise<void> {
  await logService.createNewLog(userId, {
    context: 'Fungsi ambil sesi jam kerja (endCurrentWorkSession)',
    level: 'WARN',
    message: 'Tidak ada sesi jam kerja yang aktif',
    metadata: {},
    os: 'server',
  });
}

export async function updateWorkSessionEnd(
  prisma: PrismaService,
  sessionId: bigint,
  end_at?: Date,
  stop_mode?: string,
): Promise<void> {
  await prisma.work_sessions.update({
    where: { id: sessionId },
    data: {
      end_at: end_at ?? new Date(),
      stop_mode,
    },
  });
}
