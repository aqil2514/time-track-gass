import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import {
  SessionSummaryDb,
  SessionSummaryDbInsert,
} from 'src/app/activities/interface/session_summary.interface';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import {
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';

const SESSION_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['title', 'description'],
};

export async function getLatestSummary(
  prisma: PrismaService,
  userId: string,
): Promise<string | null> {
  const data = await prisma.session_summary.findFirst({
    where: { user_id: userId },
    select: { session_end: true },
    orderBy: { session_end: 'desc' },
  });

  return data?.session_end?.toISOString() ?? null;
}

export async function getNewestData(
  prisma: PrismaService,
  latestSummary: string | null,
  userId: string,
): Promise<AIScreenReportDb[]> {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const data = await prisma.ai_screen_report.findMany({
    where: {
      user_id: userId,
      created_at: {
        lt: hourStart,
        ...(latestSummary ? { gt: new Date(latestSummary) } : {}),
      },
    },
    orderBy: { created_at: 'asc' },
  });

  return data as unknown as AIScreenReportDb[];
}

export function groupByHour(
  data: AIScreenReportDb[],
): Record<string, AIScreenReportDb[]> {
  return data.reduce(
    (acc, item) => {
      const date = new Date(item.created_at);
      const hourKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
        0,
      ).toISOString();

      if (!acc[hourKey]) acc[hourKey] = [];
      acc[hourKey].push(item);

      return acc;
    },
    {} as Record<string, AIScreenReportDb[]>,
  );
}

async function getAiSessionSummaryTitleAndDescription(
  analyzer: AnalyzerService,
  summaries: string[],
): Promise<{ title: string; description: string }> {
  const prompt = `
You are generating a short session title and a brief session description.

Below are activity summaries from one time session:

${summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate:
1. ONE concise session title (maximum 8 words)
2. A brief professional description summarizing the session (1-2 sentences)

Requirements:
- Both must be professional and natural
- Written in English
- Title max 8 words
- Return ONLY valid JSON, no markdown, no explanation

Expected format:
{
  "title": "Your short title here",
  "description": "Brief description summarizing the session"
}
  `;

  const contents: GenerateContentParameters['contents'] = [
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const response = (await analyzer.callAnalyzerProvider({
    provider: 'gemini-ai',
    model: 'gemini-2.5-flash-lite',
    contents,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: SESSION_SUMMARY_SCHEMA,
    },
  })) as GenerateContentResponse;

  return JSON.parse(response.text);
}

export async function mapToSessionSummaryDbInsert(
  analyzer: AnalyzerService,
  userId: string,
  hourKey: string,
  data: AIScreenReportDb[],
): Promise<SessionSummaryDbInsert[]> {
  const sessionStart = new Date(hourKey);
  const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

  const categoryMap = new Map<string, AIScreenReportDb[]>();
  for (const item of data) {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category)!.push(item);
  }

  const rawResult = [];
  for (const [category, items] of categoryMap) {
    rawResult.push({
      user_id: userId,
      session_start: sessionStart.toISOString(),
      session_end: sessionEnd.toISOString(),
      summaries: items.map((i) => i.summary),
      categories: category,
      raw_ids: items.map((i) => i.id),
    });
  }

  const finalResult: SessionSummaryDbInsert[] = [];
  const BATCH_SIZE = 2;
  const DELAY_MS = 2000;

  for (let i = 0; i < rawResult.length; i += BATCH_SIZE) {
    const batch = rawResult.slice(i, i + BATCH_SIZE);

    const batchResult = await Promise.all(
      batch.map(async (r) => {
        const { summaries, ...rest } = r;
        const { title, description } =
          await getAiSessionSummaryTitleAndDescription(analyzer, summaries);
        return { ...rest, title, description };
      }),
    );

    finalResult.push(...batchResult);

    if (i + BATCH_SIZE < rawResult.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return finalResult;
}

export async function createNewSessionSummary(
  prisma: PrismaService,
  payload: SessionSummaryDbInsert[],
): Promise<void> {
  await Promise.all(
    payload.map((p) =>
      prisma.session_summary.upsert({
        where: {
          user_id_session_start_categories: {
            user_id: p.user_id,
            session_start: new Date(p.session_start),
            categories: p.categories,
          },
        },
        update: {
          title: p.title,
          description: p.description,
          raw_ids: p.raw_ids,
          session_end: new Date(p.session_end),
        },
        create: {
          user_id: p.user_id,
          session_start: new Date(p.session_start),
          session_end: new Date(p.session_end),
          title: p.title,
          description: p.description,
          categories: p.categories,
          raw_ids: p.raw_ids,
        },
      }),
    ),
  );
}
