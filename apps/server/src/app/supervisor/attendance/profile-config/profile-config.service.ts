import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateUserManagementDto } from '../../_dto/attendance/profile-config.dto';
import { getAllProfileConfigs } from 'src/helpers/supervisor/attendance/profile-config/getAllProfileConfigs.helper';
import { upsertProfileConfig } from 'src/helpers/supervisor/attendance/profile-config/upsertProfileConfig.helper';

@Injectable()
export class ProfileConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    // Step 1: Ambil semua profile work config dari DB
    return getAllProfileConfigs(this.prisma);
  }

  async update(raw: CreateUserManagementDto, userId: string) {
    // Step 1: Update profile work config di DB
    return upsertProfileConfig(this.prisma, raw, userId);
  }
}
