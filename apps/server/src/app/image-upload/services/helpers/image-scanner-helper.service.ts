import {
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { ZAIService } from 'src/services/ai-z/ai-z.service';
import { ZImageAnalyzeData } from 'src/services/ai-z/interface/ai-z.interface';
import { ImageWithDate } from '../image-validation.service';

@Injectable()
export class ImageScannerHelper {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    @Inject('AWS_S3_CLIENT')
    private readonly s3Client: S3Client,
  ) {}

  async uploadToS3(imageDataUrl: string, userId: string) {
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
    return s3Key;
  }

  async uploadToS3Manual(file: ImageWithDate, userId: string) {
    const mimeType = file.file.mimetype;
    const extension = mimeType.split('/')[1];

    const s3Key = `Activity-${userId}-${file.date.getTime()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: 'tracker',
      Key: s3Key,
      Body: file.file.buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    return s3Key;
  }

  async createNewData(data: ZImageAnalyzeData) {
    const { error } = await this.supabase.from('ai_screen_report').insert(data);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
