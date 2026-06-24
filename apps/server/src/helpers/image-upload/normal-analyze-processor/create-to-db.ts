import { PrismaService } from 'src/services/prisma/prisma.service';

export interface ZImageAnalyzeData {
  user_id: string;
  s3_key: string;
  work_session_id?: string | null;
  created_at: string;
  category: string;
  app_name?: string;
  window_title?: string;
  summary?: string;
  image_hash?: string;
}

export async function createNewAnalyzeData(
  prisma: PrismaService,
  data: ZImageAnalyzeData,
) {
  await prisma.ai_screen_report.create({ data: data as any });
}
