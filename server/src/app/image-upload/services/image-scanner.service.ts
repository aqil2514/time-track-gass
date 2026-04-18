import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ZAIService } from '../../../services/ai-z/ai-z.service';
import { AIScreenReportDbInsert } from '../interfaces/ai-screen-report.interface';
import { ImageScannerHelper } from './helpers/image-scanner-helper.service';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { AnalyzerProvider } from 'src/services/analyzer/interfaces/analyzer.interface';
import {
  UserMessages,
  ZhipuModel,
} from 'src/services/analyzer/interfaces/zhipu-ai.interface';
import { AnalyzerAgentHelperService } from './helpers/analyzer-agent-helper.service';

@Injectable()
export class ImageScannerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly zAi: ZAIService,

    private readonly helper: ImageScannerHelper,

    private readonly analyzerAgent: AnalyzerAgentHelperService,
  ) {}

  // OLD
  // async analyzeActivity(imageDataUrl: string, userId: string) {
  //   const s3Key = await this.helper.uploadToS3(imageDataUrl, userId);

  //   const { data } = await this.zAi.getAiImageAnalyze(imageDataUrl, userId);
  //   const mappedData: AIScreenReportDbInsert = {
  //     ...data,
  //     user_id: userId,
  //     s3_key: s3Key,
  //   };
  //   await this.helper.createNewData(mappedData);
  // }

  async analyzeActivity(imageDataUrl: string, userId: string) {
    const s3Key = await this.helper.uploadToS3(imageDataUrl, userId);

    const { data, cost, token } = await this.analyzerAgent.analyzerAgentMapper(
      'zhipu-ai',
      imageDataUrl,
      userId,
    );

    const mappedData: AIScreenReportDbInsert = {
      ...data,
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
