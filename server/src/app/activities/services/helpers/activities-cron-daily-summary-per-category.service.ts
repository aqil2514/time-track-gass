import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { DailySummaryPerCategory } from '../../interface/daily_summary_per_category.interface';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class ActivitiesDailySummaryPerCategoryCronHelper {
  private readonly logger = new Logger(
    ActivitiesDailySummaryPerCategoryCronHelper.name,
  );
  // private readonly endpoint: string =
  //   'https://open.bigmodel.cn/api/coding/paas/v4/chat/completions';
  // private readonly apiKey: string = `Bearer ${process.env.Z_AI_API_KEY}`;
  // private readonly model: string = 'glm-4.6v';

  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    @Inject('GEMINI_AI')
    private readonly gemini: GoogleGenAI,
  ) {}

  async getUserDailyActivity(userIds: string[]): Promise<AIScreenReportDb[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from(TableName.AIScreenReport)
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .in('user_id', userIds);

    if (error) {
      this.logger.error(`Error fetch activity: ${error.message}`);
      return []; // Sebaiknya return array kosong agar loop tidak error
    }

    return data;
  }

  async getDailyAiSummary(
    reports: AIScreenReportDb[],
    categories: string[],
    user_id: string,
  ): Promise<DailySummaryPerCategory[]> {
    // 1. Pre-processing
    const simplifiedReports = reports.map((r) => ({
      activity: r.summary,
      app: r.app_name,
      time: r.created_at,
    }));

    const prompt = `
    Anda adalah asisten audit produktivitas. 
    Data berikut adalah log aktivitas dari user ID "${user_id}" per 5 menit:
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
      user_id: user_id,
      date: today,
      created_at: new Date(),
    }));

    // try {
    //   const response = await axios.post(
    //     this.endpoint,
    //     {
    //       model: this.model,
    //       messages: [{ role: 'user', content: prompt }],
    //       response_format: { type: 'json_object' },
    //     },
    //     {
    //       headers: {
    //         Authorization: this.apiKey,
    //         'Content-Type': 'application/json',
    //       },
    //     },
    //   );

    //   // 2. Parsing Response
    //   const content = JSON.parse(response.data.choices[0].message.content);
    //   const aiData = content.summaries || [];

    //   // 3. Enrichment (Menambahkan user_id dan date secara manual)
    //   const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    //   return aiData.map((item: any) => ({
    //     ...item,
    //     user_id: user_id,
    //     date: today,
    //     created_at: new Date(),
    //   }));
    // } catch (error) {
    //   // @ts-ignore
    //   this.logger.error(`Error AI Summary for user ${user_id}:`, error.message);
    //   return []; // Kembalikan array kosong agar loop utama tidak berhenti total
    // }
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

  async getCategoryByUser(userId: string): Promise<string[] | null> {
    const { data, error } = await this.supabase.rpc(
      'get_user_allowed_categories',
      { target_user_id: userId },
    );

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async saveToDb(payloads: DailySummaryPerCategory[]) {
    const { error } = await this.supabase
      .from(TableName.DailySummaryPerCategory)
      .insert(payloads);
    if (error) {
      console.error(error);
      throw error;
    }
  }
}
