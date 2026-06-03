import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';
import { SessionSummaryDbInsert } from '../../interface/session_summary.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { ZAIService } from 'src/services/ai-z/ai-z.service';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import {
  GenerateContentParameters,
  GenerateContentResponse,
} from '@google/genai';

@Injectable()
export class SummarySessionProcessorHelper {
  private readonly sessionSummarySchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
    },
    required: ['title', 'description'],
  };

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly aiService: ZAIService,

    private readonly analyzer: AnalyzerService,
  ) {}

  private async chatCompletion(prompt: string): Promise<{
    rawText: string;
    cleanJson: string;
  }> {
    const contents: GenerateContentParameters['contents'] = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = (await this.analyzer.callAnalyzerProvider({
      provider: 'gemini-ai',
      model: 'gemini-2.5-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: this.sessionSummarySchema,
      },
    })) as GenerateContentResponse;

    const rawText = response.text;
    return {
      rawText,
      cleanJson: rawText,
    };
  }

  private async getAiSessionSummaryTitleAndDescription(
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

    const { cleanJson } = await this.chatCompletion(prompt);
    return JSON.parse(cleanJson);
  }

  async getLatestSummary(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from(TableName.SessionSummary)
      .select('session_end')
      .eq('user_id', userId)
      .limit(1)
      .order('session_end', { ascending: false })
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return data?.session_end ?? null;
  }

  async getNewestData(
    latestSummary: string | null,
    userId: string,
  ): Promise<AIScreenReportDb[]> {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    let query = this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .eq('user_id', userId)
      .lt('created_at', hourStart.toISOString())
      .order('created_at');

    if (latestSummary) {
      query = query.gt('created_at', latestSummary);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  groupByHour(data: AIScreenReportDb[]): Record<string, AIScreenReportDb[]> {
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

        if (!acc[hourKey]) {
          acc[hourKey] = [];
        }
        acc[hourKey].push(item);

        return acc;
      },
      {} as Record<string, AIScreenReportDb[]>,
    );
  }

  async mapToSessionSummaryDbInsert(
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
      const summaries = items.map((i) => i.summary);
      const raw_ids = items.map((i) => i.id);

      rawResult.push({
        user_id: userId,
        session_start: sessionStart.toISOString(),
        session_end: sessionEnd.toISOString(),
        summaries,
        categories: category,
        raw_ids,
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
            await this.getAiSessionSummaryTitleAndDescription(
              summaries,
            );
          // const { title, description } =
          //   await this.aiService.getAiSessionSummaryTitleAndDescription(
          //     summaries,
          //   );
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

  async createNewSessionSummary(payload: SessionSummaryDbInsert[]) {
    const { error } = await this.supabase
      .from(TableName.SessionSummary)
      .upsert(payload, {
        onConflict: 'user_id, session_start, categories',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
