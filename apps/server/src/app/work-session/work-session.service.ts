import { Injectable } from '@nestjs/common';
import { LogService } from '../log/log.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  getActiveWorkSession,
  insertWorkSession,
  logActiveSessionWarning,
} from 'src/helpers/work-session/createNewWorkSession.helper';
import {
  logNoActiveSessionWarning,
  updateWorkSessionEnd,
} from 'src/helpers/work-session/endWorkSession.helper';

@Injectable()
export class WorkSessionService {
  constructor(
    private readonly logService: LogService,
    private readonly prisma: PrismaService,
  ) {}

  async createNewWorkSession(userId: string) {
    // Step 1: Cek apakah sesi aktif sudah ada
    const existing = await getActiveWorkSession(this.prisma, userId);
    if (existing) {
      // Step 2: Log warning sesi sudah aktif
      await logActiveSessionWarning(this.logService, userId);
      return;
    }
    // Step 3: Buat sesi baru
    await insertWorkSession(this.prisma, userId);
  }

  async endCurrentWorkSession(
    userId: string,
    end_at?: Date,
    stop_mode?: string,
  ) {
    // Step 1: Cek sesi aktif
    const session = await getActiveWorkSession(this.prisma, userId);
    if (!session) {
      // Step 2: Log warning tidak ada sesi aktif
      await logNoActiveSessionWarning(this.logService, userId);
      return;
    }
    // Step 3: Update sesi — set end_at dan stop_mode
    await updateWorkSessionEnd(this.prisma, session.id, end_at, stop_mode);
  }
}
