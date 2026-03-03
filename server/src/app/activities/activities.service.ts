import { Injectable } from '@nestjs/common';
import { TableName } from 'src/services/supabase/supabase.interface';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { AIScreenReportDb } from '../image-upload/interfaces/ai-screen-report.interface';

@Injectable()
export class ActivitiesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getActivityByUserId(userId: string) {
    const data = await this.supabaseService.getDataByColumn<AIScreenReportDb>(
      TableName.AIScreenReport,
      'user_id',
      userId,
    );

    return data;
  }
}
