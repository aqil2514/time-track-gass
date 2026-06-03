import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getUserSetting } from 'src/helpers/auth/getUserSetting.helper';
import {
  buildNewTrackerSetting,
  updateProfileSetting,
} from 'src/helpers/auth/updateTrackerMode.helper';

@Injectable()
export class AuthSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSetting(userId: string) {
    // Step 1: Ambil setting user dari DB
    return getUserSetting(this.prisma, userId);
  }

  async updateTrackerMode(userId: string, newMode: string): Promise<void> {
    // Step 1: Ambil setting user dari DB
    const currentSetting = await getUserSetting(this.prisma, userId);

    // Step 2: Build setting baru dengan mode yang diupdate
    const newSetting = buildNewTrackerSetting(currentSetting, newMode);

    // Step 3: Update setting di DB
    await updateProfileSetting(this.prisma, userId, newSetting);
  }
}
