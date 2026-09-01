import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { DailySummaryPerCategory } from 'src/app/activities/interface/daily_summary_per_category.interface';
import { GoogleGenAI } from '@google/genai';

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
): Promise<AIScreenReportDb[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

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
  const today = new Date().toISOString().split('T')[0];
  const aiData = content.summaries || [];

  return aiData.map((item: any) => ({
    ...item,
    user_id: userId,
    date: today,
    created_at: new Date(),
  }));
}

export async function saveDailySummaryPerCategory(
  prisma: PrismaService,
  payloads: DailySummaryPerCategory[],
): Promise<void> {
  await prisma.daily_summary_per_categories.createMany({
    data: payloads.map((p) => ({
      user_id: p.user_id,
      category: p.category,
      duration: p.duration,
      summary: p.summary,
      date: new Date(p.date),
    })),
  });
}
