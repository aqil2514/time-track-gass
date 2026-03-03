import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ZAIService } from '../../../services/ai-z/ai-z.service';
import { ZImageAnalyzeData } from '../../../services/ai-z/interface/ai-z.interface';
import { CloudinaryService } from '../../../services/cloudinary/cloudinary.service';
import { AIScreenReportDbInsert } from '../interfaces/ai-screen-report.interface';

@Injectable()
export class ImageScannerService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly cloudinary: CloudinaryService,
    private readonly zAi: ZAIService,
  ) {}

  private async createNewData(data: ZImageAnalyzeData) {
    const { error } = await this.supabase.from('ai_screen_report').insert(data);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async analizeActivity(file: Express.Multer.File, userId: string) {
    const { secure_url } = (await this.cloudinary.uploadImageFile(file)) as any;
    const { data } = await this.zAi.getAiImageAnalyze(secure_url);
    const mappedData: AIScreenReportDbInsert = {
      ...data,
      user_id: userId,
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
