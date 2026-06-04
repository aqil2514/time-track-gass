import { PrismaService } from 'src/services/prisma/prisma.service';

interface ZImageAnalyzeData {
  app_name: string;
  category: string;
  summary: string;
  window_title: string;
}

export async function createNewAnalyzeData(
  prisma: PrismaService,
  data: ZImageAnalyzeData,
) {
  await prisma.ai_screen_report.create({ data: data as any });
}
