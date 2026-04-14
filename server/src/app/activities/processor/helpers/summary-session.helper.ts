import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { TableName } from 'src/services/supabase/supabase.interface';
import {
  SessionSummaryDb,
  SessionSummaryDbInsert,
} from '../../interface/session_summary.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { ZAIService } from 'src/services/ai-z/ai-z.service';

@Injectable()
export class SummarySessionProcessorHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly aiService: ZAIService,
  ) {}

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

    // Batch AI call tetap sama
    const finalResult: SessionSummaryDbInsert[] = [];
    const BATCH_SIZE = 2;
    const DELAY_MS = 2000;

    for (let i = 0; i < rawResult.length; i += BATCH_SIZE) {
      const batch = rawResult.slice(i, i + BATCH_SIZE);

      const batchResult = await Promise.all(
        batch.map(async (r) => {
          const { summaries, ...rest } = r;
          const { title, description } =
            await this.aiService.getAiSessionSummaryTitleAndDescription(
              summaries,
            );
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
