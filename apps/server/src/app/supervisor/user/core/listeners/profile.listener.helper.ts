import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProfilesDbInsert } from 'src/app/auth/interfaces/profiles.interface';

@Injectable()
export class ProfileListenerHelper {
  private readonly logger = new Logger(ProfileListenerHelper.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNewProfileWorkConfig(payload: ProfilesDbInsert) {
    this.logger.log('Menambahkan data user untuk keperluan absensi');

    const profile = await this.prisma.profiles.findFirst({
      where: { username: payload.username },
      select: { id: true },
    });

    if (!profile) {
      throw new Error(`Profile dengan username ${payload.username} tidak ditemukan.`);
    }

    await this.prisma.profile_work_configs.create({
      data: {
        profile_id: profile.id,
        bonus_per_hour: 0,
        min_hours_monthly: 140,
        min_hours_weekly: 35,
        penalty_per_hour: 30000,
        penalty_type: 'fee',
      },
    });

    this.logger.log('Penambahan data user untuk keperluan absensi berhasil');
  }

  async deleteProfileWorkConfig(userId: string) {
    this.logger.log('Menghapus data konfigurasi absensi user');

    await this.prisma.profile_work_configs.deleteMany({
      where: { profile_id: userId },
    });

    this.logger.log('Data konfigurasi absensi user berhasil dihapus');
  }
}
