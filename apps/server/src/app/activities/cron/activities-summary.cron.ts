import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { getAllUsers } from 'src/helpers/activities/getAllUsers.helper';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Injectable()
export class ActivitiesSummaryCronService {
  private readonly logger = new Logger(ActivitiesSummaryCronService.name);

  constructor(
    @InjectQueue(QUERY_NAME.DAILY_SUMMARY)
    private readonly dailySummaryQueue: Queue,

    @InjectQueue(QUERY_NAME.DAILY_CATEGORY)
    private readonly dailySummaryCategoryQueue: Queue,

    @InjectQueue(QUERY_NAME.SUMMARY_SESSION)
    private readonly summaryQueue: Queue,

    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    disabled: process.env.NODE_ENV === 'development',
  })
  async createNewSummary() {
    if (process.env.NODE_ENV === 'development') return;

    // Step 1: Ambil semua user
    const allUser = await getAllUsers(this.prisma);

    // Step 2: Tambahkan job ke queue per user
    for (const user of allUser) {
      await this.summaryQueue.add(
        'summary-session',
        { userId: user },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummary() {
    // Step 1: Ambil semua user
    const allUser = await getAllUsers(this.prisma);

    // Step 2: Tambahkan job ke queue per user
    for (const user of allUser) {
      await this.dailySummaryQueue.add(
        'daily-summary',
        { userId: user },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummaryPerCategory() {
    this.logger.log('Memanggil fungsi buat summary daily per kategori');

    // Step 1: Ambil semua user
    const allUser = await getAllUsers(this.prisma);

    // Step 2: Tambahkan job ke queue per user
    for (const user of allUser) {
      await this.dailySummaryCategoryQueue.add(
        'daily-category-summary',
        { userId: user },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }
  }
}
