import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ZAIService } from '../../../services/ai-z/ai-z.service';
import { ZImageAnalyzeData } from '../../../services/ai-z/interface/ai-z.interface';
import { AIScreenReportDbInsert } from '../interfaces/ai-screen-report.interface';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class ImageScannerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly zAi: ZAIService,

    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
  ) {}

  private async createNewData(data: ZImageAnalyzeData) {
    const { error } = await this.supabase.from('ai_screen_report').insert(data);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async analyzeActivity(imageDataUrl: string, userId: string) {
    const mimeType = imageDataUrl.split(',')[0].match(/:(.*?);/)[1];
    const buffer = Buffer.from(imageDataUrl.split(',')[1], 'base64');
    const extension = mimeType.split('/')[1];

    const s3Key = `Activity-${userId}-${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: 'tracker',
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    const { data } = await this.zAi.getAiImageAnalyze(imageDataUrl);
    const mappedData: AIScreenReportDbInsert = {
      ...data,
      user_id: userId,
      s3_key: s3Key,
    };
    await this.createNewData(mappedData);
  }

  async getActivities() {
    const { data, error } = await this.supabase
      .from('ai_screen_report')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }
}
