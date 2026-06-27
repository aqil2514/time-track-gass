import Redis from 'ioredis';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from 'src/constants/timezone';

const TTL_SECONDS = 86400;

export interface SlotInvalidStatus {
  reason: string;
  s3Key: string;
  originalFilename?: string;
}

function buildKey(userId: string, slotId: number, date: string): string {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const formattedDate = format(localDate, 'dd-MM-yyyy');
  return `manual-invalid:${userId}:${slotId}:${formattedDate}`;
}

function buildS3KeysKey(userId: string, slotId: number, date: string): string {
  const localDate = toZonedTime(new Date(date), TIMEZONE);
  const formattedDate = format(localDate, 'dd-MM-yyyy');
  return `manual-s3keys:${userId}:${slotId}:${formattedDate}`;
}

export async function setSlotS3Keys(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
  s3Keys: string[],
): Promise<void> {
  const key = buildS3KeysKey(userId, slotId, date);
  await redis.set(key, JSON.stringify(s3Keys), 'EX', TTL_SECONDS);
}

export async function getSlotS3Keys(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
): Promise<string[] | null> {
  const key = buildS3KeysKey(userId, slotId, date);
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as string[];
}

export async function clearSlotS3Keys(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  const key = buildS3KeysKey(userId, slotId, date);
  await redis.del(key);
}

export async function appendSlotInvalid(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
  item: SlotInvalidStatus,
): Promise<void> {
  const key = buildKey(userId, slotId, date);
  await redis.rpush(key, JSON.stringify(item));
  await redis.expire(key, TTL_SECONDS);
}

export async function getSlotInvalid(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
): Promise<SlotInvalidStatus[] | null> {
  const key = buildKey(userId, slotId, date);
  const items = await redis.lrange(key, 0, -1);
  if (!items.length) return null;
  return items.map((item) => JSON.parse(item) as SlotInvalidStatus);
}

export async function clearSlotInvalid(
  redis: Redis,
  userId: string,
  slotId: number,
  date: string,
): Promise<void> {
  const key = buildKey(userId, slotId, date);
  await redis.del(key);
}
