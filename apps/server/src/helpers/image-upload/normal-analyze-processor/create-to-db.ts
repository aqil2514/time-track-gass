import { PrismaService } from 'src/services/prisma/prisma.service';
import { ZImageAnalyzeData } from 'src/services/ai-z/interface/ai-z.interface';

export async function createNewAnalyzeData(
  prisma: PrismaService,
  data: ZImageAnalyzeData,
) {
  await prisma.ai_screen_report.create({ data: data as any });
}
