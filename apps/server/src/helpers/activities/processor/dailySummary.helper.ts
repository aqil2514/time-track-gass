import { PrismaService } from 'src/services/prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { formatInTimeZone } from 'date-fns-tz';
import { SessionSummaryDb } from 'src/app/activities/interface/session_summary.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { ActivityData } from 'src/app/activities/interface/activities_data.interface';
import { DailySummaryDbInsert } from 'src/app/activities/interface/daily_summary.interface';
interface AiDailySummaryResult {
  summary: string;
  highlights: string[];
  productivity_description: string;
}

const APP_TIMEZONE = 'Asia/Jakarta';

function toDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/**
 * Returns the list of calendar days (Asia/Jakarta, oldest first) that still
 * need a daily-summary run for this user: every day after the last one
 * already saved, up to (and including) yesterday. If nothing was ever
 * saved, only yesterday is returned so we don't try to backfill forever.
 * Capped at `maxBackfillDays` (most recent days kept) so a very old gap
 * doesn't trigger an unbounded number of AI calls in one run.
 */
export async function getPendingSummaryDates(
  prisma: PrismaService,
  userId: string,
  maxBackfillDays = 14,
): Promise<string[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  const lastRow = await prisma.daily_summary.findFirst({
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

export async function getSessionActivityByUserId(
  prisma: PrismaService,
  userIds: string[],
  dateKey: string,
): Promise<SessionSummaryDb[]> {
  const start = new Date(`${dateKey}T00:00:00.000+07:00`);
  const end = new Date(`${dateKey}T23:59:59.999+07:00`);

  const data = await prisma.session_summary.findMany({
    where: {
      user_id: { in: userIds },
      session_start: { gte: start, lte: end },
    },
    orderBy: { session_start: 'desc' },
  });

  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    created_at: (row.created_at as any)?.toISOString?.() ?? row.created_at,
    session_start: (row.session_start as any)?.toISOString?.() ?? row.session_start,
    session_end: (row.session_end as any)?.toISOString?.() ?? row.session_end,
    title: row.title,
    description: row.description,
    categories: row.categories,
    raw_ids: row.raw_ids as string[],
  })) as SessionSummaryDb[];
}

export async function getRawActivityByIds(
  prisma: PrismaService,
  ids: string[],
): Promise<AIScreenReportDb[]> {
  const data = await prisma.ai_screen_report.findMany({
    where: { id: { in: ids } },
    orderBy: { created_at: 'desc' },
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
  })) as unknown as AIScreenReportDb[];
}

export function mapToActivityData(
  allReports: AIScreenReportDb[],
  summariesData: SessionSummaryDb[],
): ActivityData[] {
  const reportMap = new Map(allReports.map((r) => [r.id, r]));

  return summariesData.map((summary) => {
    const { raw_ids, ...rest } = summary;
    return {
      ...rest,
      items: raw_ids.map((id) => reportMap.get(id)).filter(Boolean),
    };
  });
}

async function analyzeSummaryByAi(
  gemini: GoogleGenAI,
  sessionActivities: ActivityData[],
): Promise<AiDailySummaryResult> {
  const summaries = sessionActivities.map(
    (s) => s.title || s.description || '',
  );

  const prompt = `
You are generating a professional daily summary from multiple activity sessions.

Below are activity summaries for one user today:

${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate the following:
1. A professional daily summary (1-3 sentences) describing the user's activities.
2. An array of highlights (main modules, tasks, or topics) that appear in the summary.
3. A productivity description, e.g., "5.5h coding from 6.5h total", based on the activities.

Requirements:
- Use only English.
- Highlights must appear in the summary.
- Return ONLY valid JSON.
- Do NOT wrap in markdown, backticks, or add extra text.
- Always return at least 1 highlight. If unsure, pick the main topic.

Expected JSON format:
{
  "summary": "Brief professional daily summary...",
  "highlights": ["word1", "word2", "word3"],
  "productivity_description": "5.5h coding from 6.5h total"
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
          summary: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          productivity_description: { type: 'string' },
        },
        required: ['summary', 'highlights', 'productivity_description'],
      },
    },
  });

  return JSON.parse(res.text);
}

export async function mapToDailySummaryDbInsert(
  gemini: GoogleGenAI,
  raw: ActivityData[],
  dateKey: string,
): Promise<DailySummaryDbInsert[]> {
  const userIds = Array.from(new Set(raw.map((r) => r.user_id)));

  const startOfDayJakarta = formatInTimeZone(
    new Date(`${dateKey}T00:00:00.000+07:00`),
    'Asia/Jakarta',
    'yyyy-MM-dd 00:00:00XXX',
  );

  const dailySummaries: DailySummaryDbInsert[] = [];
  const BATCH_SIZE = 2;
  const DELAY_MS = 2000;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const batchResult = await Promise.all(
      batch.map(async (user) => {
        const selectedData = raw.filter((data) => data.user_id === user);
        if (!selectedData.length) return null;

        const { highlights, productivity_description, summary } =
          await analyzeSummaryByAi(gemini, selectedData);

        return {
          date: startOfDayJakarta,
          user_id: user,
          highlights,
          productivity_description,
          summary,
        } as DailySummaryDbInsert;
      }),
    );

    dailySummaries.push(
      ...(batchResult.filter(Boolean) as DailySummaryDbInsert[]),
    );

    if (i + BATCH_SIZE < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return dailySummaries;
}

export async function createNewDailySummary(
  prisma: PrismaService,
  payload: DailySummaryDbInsert[],
): Promise<void> {
  await Promise.all(
    payload.map((p) =>
      prisma.daily_summary.upsert({
        where: {
          user_id_date: {
            user_id: p.user_id,
            date: new Date(p.date),
          },
        },
        update: {
          summary: p.summary,
          highlights: p.highlights,
          productivity_description: p.productivity_description,
        },
        create: {
          user_id: p.user_id,
          date: new Date(p.date),
          summary: p.summary,
          highlights: p.highlights,
          productivity_description: p.productivity_description,
        },
      }),
    ),
  );
}
