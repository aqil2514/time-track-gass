import { Injectable } from '@nestjs/common';
import { AppLogInsertClient } from './log.interface';
import { PrismaService } from 'src/services/prisma/prisma.service';
import {
  buildLogPayload,
  insertLog,
} from 'src/helpers/log/createNewLog.helper';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async createNewLog(userId: string, payload: AppLogInsertClient) {
    // Step 1: Build db payload
    const dbPayload = buildLogPayload(userId, payload);
    // Step 2: Insert log
    await insertLog(this.prisma, dbPayload);
  }
}
