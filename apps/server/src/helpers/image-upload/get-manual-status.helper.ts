import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { TIMEZONE } from 'src/constants/timezone';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getSlotInvalid, SlotInvalidStatus } from 'src/helpers/image-upload/manual-slot-status/slot-status-redis.helper';

export async function checkIsHaveInDb(
  prisma: PrismaService,
  slotId: number,
  userId: string,
  date: string,
): Promise<boolean> {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const dateString = format(localDate, 'yyyy-MM-dd');

  const utcHour = slotId - 7;

  const startOfHour = new Date(`${dateString}T00:00:00.000Z`);
  startOfHour.setUTCHours(utcHour, 0, 0, 0);

  const endOfHour = new Date(`${dateString}T00:00:00.000Z`);
  endOfHour.setUTCHours(utcHour, 59, 59, 999);

  const data = await prisma.ai_screen_report.findFirst({
    where: {
      user_id: userId,
      deleted_at: null,
      created_at: {
        gte: startOfHour,
        lte: endOfHour,
      },
    },
    select: { id: true },
  });

  return !!data;
}

export async function checkIsInvalid(
  redis: Redis,
  slotId: number,
  userId: string,
  date: string,
): Promise<SlotInvalidStatus[] | null> {
  return getSlotInvalid(redis, userId, slotId, date);
}

export async function checkIsHaveInBullMq(
  manualAnalyzeQueue: Queue,
  slotId: number,
  userId: string,
  date: string,
): Promise<boolean> {
  const job = await manualAnalyzeQueue.getJob(`manual-analyze-${userId}-${slotId}-${date}`);
  if (!job) return false;

  const state = await job.getState();
  return state === 'waiting' || state === 'active' || state === 'delayed';
}
