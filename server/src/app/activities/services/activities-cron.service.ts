import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesSessionSummaryCronHelper } from './helpers/activites-cron-session-summary-helper.service';
import { ActivitiesCronMessageHelper } from './helpers/activities-cron-message.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import {
  RPCFunctionName,
  TableName,
} from 'src/services/supabase/supabase.interface';
import {
  AttendanceLogsDbInsert,
} from 'src/app/supervisor/interfaces/attendances/attendances-logs.interface';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(
    @InjectQueue(QUERY_NAME.DAILY_SUMMARY)
    private readonly dailySummaryQueue: Queue,

    @InjectQueue(QUERY_NAME.DAILY_CATEGORY)
    private readonly dailySummaryCategoryQueue: Queue,

    @InjectQueue(QUERY_NAME.SUMMARY_SESSION)
    private summaryQueue: Queue,

    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,

    private readonly sessionSummaryHelper: ActivitiesSessionSummaryCronHelper,
    private readonly messageHelper: ActivitiesCronMessageHelper,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    disabled: process.env.NODE_ENV === 'development',
  })
  async createNewSummary() {
    if (process.env.NODE_ENV === 'development') return;

    const allUser = await this.sessionSummaryHelper.getAllUser();

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
    const allUser = await this.sessionSummaryHelper.getAllUser();

    for (const user of allUser) {
      await this.dailySummaryQueue.add(
        'daily-summary',
        { userId: user },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummaryPerCategory() {
    this.logger.log('Memanggil fungsi buat summary daily per kategori');

    const allUser = await this.sessionSummaryHelper.getAllUser();

    for (const user of allUser) {
      await this.dailySummaryCategoryQueue.add(
        'daily-category-summary',
        {
          userId: user,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    }
  }

  @Cron('0 11 * * *', { timeZone: 'Asia/Jakarta' })
  async sendMorningBatchReminder() {
    await this.messageHelper.sendMessageBulk(
      'Cek Batch Pagi: Pastikan semua sudah Start Session (min. 2-3 jam).',
    );
  }

  @Cron('0 15 * * *', { timeZone: 'Asia/Jakarta' })
  async sendAfternoonBatchReminder() {
    await this.messageHelper.sendMessageBulk(
      'Cek Batch Siang: Rawan lupa! Aktifkan sesi setelah istirahat.',
    );
  }

  @Cron('0 17 * * *', { timeZone: 'Asia/Jakarta' })
  async sendFinalCheckReminder() {
    await this.messageHelper.sendMessageBulk(
      'Final Check: Verifikasi akhir sebelum operasional tutup.',
    );
  }

  // WA reminders are disabled because KonekWA API key errors spam production logs.

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    timeZone: 'Asia/Jakarta',
  })
  async createNewTotalWorkTime() {
    const { data: dbData, error } = await this.supabase.rpc(
      RPCFunctionName.GET_SCREEN_REPORT_YESTERDAY,
    );

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    if (!dbData || dbData.length === 0) {
      console.warn('Tidak ada data kerja untuk kemarin.');
      return;
    }

    const payload: AttendanceLogsDbInsert[] = dbData.map((d) => ({
      duration_minutes: Number(d.total_work_time), // Pastikan angka
      profile_id: d.user_id,
      work_date: d.date,
    }));

    const { error: errAddData } = await this.supabase
      .from(TableName.AttendanceLogs)
      .upsert(payload, { onConflict: 'profile_id, work_date' });

    if (errAddData) {
      console.error('Insert Error:', errAddData);
      throw errAddData;
    }

    this.logger.log(`Berhasil memindahkan ${payload.length} data kerja.`);
  }
}
