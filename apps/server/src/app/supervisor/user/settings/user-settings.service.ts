import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UserSettingsDto } from '../../_dto/user-settings.dto';
import { getUserSettings } from 'src/helpers/supervisor/user/getUserSettings.helper';
import { updateUserSettings } from 'src/helpers/supervisor/user/updateUserSettings.helper';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSettings(id: string) {
    // Step 1: Ambil settings user dari DB
    return getUserSettings(this.prisma, id);
  }

  async updateUserSettings(id: string, settings: UserSettingsDto) {
    // Step 1: Update settings user di DB
    return updateUserSettings(this.prisma, id, settings);
  }
}
