import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ImageScannerHelper } from './helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from './helpers/analyzer-agent-helper.service';

@Injectable()
export class ImageScannerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly helper: ImageScannerHelper,

    private readonly analyzerAgent: AnalyzerAgentHelperService,
  ) {}

  async analyzeActivity(imageDataUrl: string, userId: string) {
    const s3Key = await this.helper.uploadToS3(imageDataUrl, userId);

    const { data } = await this.analyzerAgent.analyzerAgentMapper(
      'gemini-ai',
      imageDataUrl,
      userId,
    );

    const mappedData = {
      ...(data as any),
      user_id: userId,
      s3_key: s3Key,
    };  

    await this.helper.createNewData(mappedData);
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
