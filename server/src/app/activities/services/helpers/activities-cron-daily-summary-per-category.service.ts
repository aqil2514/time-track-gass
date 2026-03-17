import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class ActivitiesDailySummaryPerCategoryCronHelper {
  private readonly endpoint: string =
    'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
  private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  private readonly model: string = 'glm-4.6v';

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getUserDailyActivity(userId: string): Promise<AIScreenReportDb[]> {
    const { data, error } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async getDailyAiSummary(reports: AIScreenReportDb[], categories: string[]) {
    const prompt = `
    Anda adalah asisten audit produktivitas. 
    Data berikut adalah log aktivitas user per 5 menit:
    ${JSON.stringify(reports)}

    Tugas Anda:
    1. Kelompokkan aktivitas ke dalam kategori ini saja: ${categories.join(', ')}.
    2. Hitung durasi per kategori (1 log = 5 menit).
    3. Buat satu summary singkat untuk masing-masing kategori tersebut.
    
    Output WAJIB berupa JSON array dengan format:
    [{"category": "string", "duration": number, "summary": "string"}]
  `;

    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error AI Summary:', error.response?.data || error.message);
      throw error;
    }

    // return JSON.parse(result.choices[0].message.content);
  }

  async getAllCategories(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(TableName.Category)
      .select('*');

    if (error) {
      console.error(error);
      throw error;
    }

    return data.map((d) => d.category);
  }

  async mappingToDbPerUser(userId: string) {
    const data = await this.getUserDailyActivity(userId);
  }
}
