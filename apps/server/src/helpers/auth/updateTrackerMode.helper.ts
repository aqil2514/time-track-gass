import { TrackerMode, UserSettings } from 'src/app/auth/interfaces/profiles.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';

export function buildNewTrackerSetting(
  currentSetting: UserSettings,
  newMode: string,
): UserSettings {
  return {
    ...currentSetting,
    tracker: {
      ...currentSetting.tracker,
      mode: newMode as TrackerMode,
    },
  };
}

export async function updateProfileSetting(
  prisma: PrismaService,
  userId: string,
  newSetting: UserSettings,
): Promise<void> {
  await prisma.profiles.update({
    where: { id: userId },
    data: { settings: newSetting as any },
  });
}
