import { PrismaService } from 'src/services/prisma/prisma.service';
import { UserSettingsDto } from 'src/app/supervisor/dto/user-settings.dto';

export async function updateUserSettings(
  prisma: PrismaService,
  id: string,
  settings: UserSettingsDto,
): Promise<void> {
  await prisma.profiles.update({
    where: { id },
    data: { settings: settings as any },
  });
}
