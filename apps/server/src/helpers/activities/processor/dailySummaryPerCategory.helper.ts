import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { DailySummaryPerCategory } from 'src/app/activities/interface/daily_summary_per_category.interface';
import { GoogleGenAI } from '@google/genai';

const APP_TIMEZONE = 'Asia/Jakarta';

function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

function dayBoundsUtc(dateKey: string): { start: Date; end: Date } {
  // dateKey is a calendar day in Asia/Jakarta (UTC+7). Build UTC instants
  // for that day's 00:00:00.000-07:00 .. 23:59:59.999-07:00.
  const start = new Date(`${dateKey}T00:00:00.000+07:00`);
  const end = new Date(`${dateKey}T23:59:59.999+07:00`);
  return { start, end };
}

/**
 * Returns the list of calendar days (Asia/Jakarta, oldest first) that still
 * need a daily-category-summary run for this user: every day after the last
 * one already saved, up to (and including) yesterday. If nothing was ever
 * saved, only yesterday is returned so we don't try to backfill forever.
 * The result is capped at `maxBackfillDays` (most recent days kept) so a
 * very old gap doesn't trigger an unbounded number of AI calls in one run.
 */
export async function getPendingCategoryDates(
  prisma: PrismaService,
  userId: string,
  maxBackfillDays = 14,
): Promise<string[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const lastRow = await prisma.daily_summary_per_categories.findFirst({
    where: { user_id: userId },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (!lastRow?.date) return [yesterdayKey];

  const lastKey = toDateKey(new Date(lastRow.date));
  if (lastKey >= yesterdayKey) return [];

  const pending: string[] = [];
  const cursor = new Date(`${yesterdayKey}T00:00:00.000+07:00`);

  while (true) {
    const cursorKey = toDateKey(cursor);
    if (cursorKey <= lastKey) break;

    pending.unshift(cursorKey);
    cursor.setDate(cursor.getDate() - 1);
  }

  return pending.slice(-maxBackfillDays);
}

export async function getCategoryByUser(
  prisma: PrismaService,
  userId: string,
): Promise<string[] | null> {
  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: {
      divisions: {
        select: { vision_config: true },
      },
    },
  });

  const config = profile?.divisions?.vision_config as {
    allowed_categories: string[];
  } | null;

  return config?.allowed_categories ?? null;
}

export async function getUserDailyActivity(
  prisma: PrismaService,
  userIds: string[],
  dateKey: string,
): Promise<AIScreenReportDb[]> {
  const { start: startOfDay, end: endOfDay } = dayBoundsUtc(dateKey);

  const data = await prisma.ai_screen_report.findMany({
    where: {
      user_id: { in: userIds },
      created_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  return data.map((row) => ({
    id: row.id,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    app_name: row.app_name,
    window_title: row.window_title,
    category: row.category,
    summary: row.summary,
    user_id: row.user_id,
    s3_key: row.s3_key,
    interval: Number(row.interval ?? 0),
  })) as AIScreenReportDb[];
}

export async function getDailyAiSummary(
  gemini: GoogleGenAI,
  reports: AIScreenReportDb[],
  categories: string[],
  userId: string,
  dateKey: string,
): Promise<DailySummaryPerCategory[]> {
  const simplifiedReports = reports.map((r) => ({
    activity: r.summary,
    app: r.app_name,
    time: r.created_at,
  }));

  const prompt = `
    Anda adalah asisten audit produktivitas.
    Data berikut adalah log aktivitas dari user ID "${userId}" per 5 menit:
    ${JSON.stringify(simplifiedReports)}

    Tugas Anda:
    1. Kelompokkan ke kategori: ${categories.join(', ')}.
    2. Hitung durasi (1 log = 5 menit). Output "duration" harus angka (number).
    3. Buat satu summary singkat per kategori.

    Output WAJIB berupa JSON object dengan format:
    {
      "summaries": [
        {"category": "string", "duration": number, "summary": "string"}
      ]
    }
  `;

  const res = await gemini.models.generateContent({
    model: 'gemini-flash-latest',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          summaries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                duration: { type: 'number' },
                summary: { type: 'string' },
              },
              required: ['category', 'duration', 'summary'],
            },
          },
        },
        required: ['summaries'],
      },
    },
  });

  const content = JSON.parse(res.text);
  const aiData = content.summaries || [];

  return aiData.map((item: any) => ({
    ...item,
    user_id: userId,
    date: dateKey,
    created_at: new Date(),
  }));
}

export async function saveDailySummaryPerCategory(
  prisma: PrismaService,
  payloads: DailySummaryPerCategory[],
): Promise<void> {
  await Promise.all(
    payloads.map((p) =>
      prisma.daily_summary_per_categories.upsert({
        where: {
          user_id_date_category: {
            user_id: p.user_id,
            date: new Date(p.date),
            category: p.category,
          },
        },
        update: {
          duration: p.duration,
          summary: p.summary,
        },
        create: {
          user_id: p.user_id,
          category: p.category,
          duration: p.duration,
          summary: p.summary,
          date: new Date(p.date),
        },
      }),
    ),
  );
}
