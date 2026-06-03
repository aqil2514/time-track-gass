import { AppLogInsertClient, AppLogInsertDb } from 'src/app/log/log.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export function buildLogPayload(
  userId: string,
  payload: AppLogInsertClient,
): AppLogInsertDb {
  return {
    ...payload,
    os: 'server',
    user_id: userId,
  };
}

export async function insertLog(
  prisma: PrismaService,
  payload: AppLogInsertDb,
): Promise<void> {
  await prisma.app_logs.create({
    data: {
      user_id: payload.user_id,
      level: payload.level,
      os: payload.os,
      message: payload.message,
      context: payload.context,
      metadata: payload.metadata as any,
    },
  });
}
