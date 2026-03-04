import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivityData } from '../interface/activities_data.interface';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly helper: ActivitiesFetcherHelper,
  ) {}

  async getActivityData(userId: string): Promise<ActivityData[]> {
    const summariesData = await this.helper.getSessionActivityByUserId(userId);

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports = await this.helper.getRawActivityRawIds(allRawIds);

    const reportMap = new Map(allReports.map((r) => [r.id, r]));

    const data: ActivityData[] = summariesData.map((summary) => {
      const { raw_ids, ...rest } = summary;

      return {
        ...rest,
        items: raw_ids.map((id) => reportMap.get(id)).filter(Boolean),
      };
    });

    return data;
  }
}
