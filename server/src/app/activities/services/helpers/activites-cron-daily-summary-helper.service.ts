import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SessionSummaryDb } from '../../interface/session_summary.interface';
import { ActivityData } from '../../interface/activities_data.interface';
import { DailySummaryDbInsert } from '../../interface/daily_summary.interface';
import { ZAIService } from 'src/services/ai-z/ai-z.service';
import { formatInTimeZone } from 'date-fns-tz';
import { GoogleGenAI } from '@google/genai';
import { AiDailySummaryResult } from 'src/services/ai-z/interface/ai-z.interface';

@Injectable()
export class ActivitiesDailySummaryCronHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly aiService: ZAIService,

    @Inject('GEMINI_AI')
    private readonly gemini: GoogleGenAI,
  ) {}

  private buildPrompt(sessionActivities: ActivityData[]) {
    const summaries = sessionActivities.map(
      (s) => s.title || s.description || '',
    );

    return `
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
  }

  private async analyzeSummaryByAi(
    sessionActivities: ActivityData[],
  ): Promise<AiDailySummaryResult> {
    const prompt = this.buildPrompt(sessionActivities);

    const res = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
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

    const responseText = res.text;
    return JSON.parse(responseText);
  }

  async mapToDailySummaryDbInsert(
    raw: ActivityData[],
  ): Promise<DailySummaryDbInsert[]> {
    const userIds = Array.from(new Set(raw.map((r) => r.user_id)));

    const now = new Date();
    const timeZone = 'Asia/Jakarta';

    const startOfDayJakarta = formatInTimeZone(
      now,
      timeZone,
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
            await this.analyzeSummaryByAi(selectedData);

          // const { highlights, productivity_description, summary } =
          //   await this.aiService.getAiDailySummary(selectedData);

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

  async getSessionActivityByUserId(
    userIds: string[],
  ): Promise<SessionSummaryDb[]> {
    const start = new Date();
    start.setHours(0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data, error } = await this.supabase
      .from('session_summary')
      .select('*')
      .in('user_id', userIds)
      .gte('session_start', start.toISOString())
      .lt('session_start', end.toISOString())
      .order('session_start', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async createNewDailySummary(payload: DailySummaryDbInsert[]) {
    const { error } = await this.supabase
      .from('daily_summary')
      .upsert(payload, {
        onConflict: 'user_id, date',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
