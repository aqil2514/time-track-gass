import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { SessionSummaryDbInsert } from '../../interface/session_summary.interface';
import { ZAIService } from 'src/services/ai-z/ai-z.service';

@Injectable()
export class ActivitiesCronHelper {
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly aiService: ZAIService,
  ) {}

  async getAllUser() {
    const userIdsDb: { id: string }[] = await this.supabaseService.getAllData(
      TableName.Profiles,
      'id',
    );

    return userIdsDb.map((d) => d.id);
  }

  async getDuringOneHourActivities(from: Date, to: Date, userIds: string[]) {
    const { data, error } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .in('user_id', userIds)
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString());

    if (error) {
      console.error(error);
      throw error;
    }

    return data as AIScreenReportDb[];
  }

  async mapToSessionSummaryDbInsert(
    data: AIScreenReportDb[],
  ): Promise<SessionSummaryDbInsert[]> {
    const result: SessionSummaryDbInsert[] = [];
    const rawResult = [];

    // 🔹 Group per user dulu
    const userMap = new Map<string, AIScreenReportDb[]>();
    for (const item of data) {
      if (!userMap.has(item.user_id)) userMap.set(item.user_id, []);
      userMap.get(item.user_id)!.push(item);
    }

    for (const [userId, activities] of userMap) {
      // 🔹 Group per kategori
      const categoryMap = new Map<string, AIScreenReportDb[]>();
      activities.forEach((a) => {
        if (!categoryMap.has(a.category)) categoryMap.set(a.category, []);
        categoryMap.get(a.category)!.push(a);
      });

      for (const [category, items] of categoryMap) {
        // 🔹 session_start = jam pertama aktivitas
        const times = items.map((i) => new Date(i.created_at).getTime());
        const minTime = new Date(Math.min(...times));
        const sessionStart = new Date(minTime);
        sessionStart.setMinutes(0, 0, 0); // bulatkan ke jam penuh

        // 🔹 session_end = next hour
        const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

        // 🔹 title = gabungan summary 3 pertama
        const summaries = items.map((i) => i.summary);

        // 🔹 raw_ids
        const raw_ids = items.map((i) => i.id);

        rawResult.push({
          user_id: userId,
          session_start: sessionStart.toISOString(),
          session_end: sessionEnd.toISOString(),
          summaries,
          categories: category, // hanya satu kategori per record
          raw_ids,
        });
      }
    }

    const finalResult = await Promise.all(
      rawResult.map(async (r) => {
        const { summaries, ...rest } = r;

        const title = await this.aiService.getAiSessionSummaryTitle(summaries);

        return {
          ...rest,
          title,
        };
      }),
    );

    return finalResult;
  }

  async createNewSessionSummary(payload: SessionSummaryDbInsert[]) {
    const { error } = await this.supabase
      .from('session_summary')
      .insert(payload);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
