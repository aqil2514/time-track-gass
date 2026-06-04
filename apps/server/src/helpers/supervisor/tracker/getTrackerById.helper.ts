import { PrismaService } from 'src/services/prisma/prisma.service';
import { AIScreenReportPopulateUser } from 'src/app/image-upload/interfaces/ai-screen-report.interface';

export async function getTrackerById(
  prisma: PrismaService,
  activityId: string,
): Promise<AIScreenReportPopulateUser | null> {
  const data = await prisma.ai_screen_report.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      created_at: true,
      app_name: true,
      window_title: true,
      category: true,
      summary: true,
      s3_key: true,
      profiles: {
        select: {
          id: true,
          role: true,
          email: true,
          division: true,
          username: true,
          full_name: true,
        },
      },
    },
  });

  if (!data) return null;

  const { profiles, ...rest } = data as any;

  return {
    ...rest,
    created_at: rest.created_at?.toISOString?.() ?? rest.created_at,
    user: profiles,
  } as AIScreenReportPopulateUser;
}
