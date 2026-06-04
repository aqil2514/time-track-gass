import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateUserManagementDto } from 'src/app/supervisor/dto/attendance/profile-config.dto';

export async function upsertProfileConfig(
  prisma: PrismaService,
  raw: CreateUserManagementDto,
  userId: string,
): Promise<void> {
  await prisma.profile_work_configs.updateMany({
    where: { profile_id: userId },
    data: {
      bonus_per_hour: raw.hourlyBonus,
      min_hours_monthly: raw.monthlyHour,
      min_hours_weekly: raw.weeklyHour,
      penalty_per_hour: raw.hourlyPenalty,
      penalty_type: raw.penaltyType,
    },
  });
}
