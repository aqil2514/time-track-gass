import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SessionSummaryDb } from '../../interface/session_summary.interface';
import { ActivityData } from '../../interface/activities_data.interface';
import { DailySummaryDbInsert } from '../../interface/daily_summary.interface';
import { ZAIService } from 'src/services/ai-z/ai-z.service';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class ActivitiesDailySummaryCronHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly aiService: ZAIService,
  ) {}

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

    const dailySummaries = await Promise.all(
      userIds.map(async (user) => {
        const selectedData = raw.filter((data) => data.user_id === user);
        if (!selectedData.length) return null;

        const { highlights, productivity_description, summary } =
          await this.aiService.getAiDailySummary(selectedData);

        return {
          date: startOfDayJakarta, // ini UTC tapi mewakili 00:00 WIB
          user_id: user,
          highlights,
          productivity_description,
          summary,
        } as DailySummaryDbInsert;
      }),
    );

    return dailySummaries.filter(Boolean) as DailySummaryDbInsert[];
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
    const { error } = await this.supabase.from('daily_summary').insert(payload);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
