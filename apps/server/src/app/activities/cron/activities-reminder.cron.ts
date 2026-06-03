import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { sendMessageBulk } from 'src/helpers/activities/sendReminderMessage.helper';

@Injectable()
export class ActivitiesReminderCronService {
  constructor(private readonly http: HttpService) {}

  @Cron('0 11 * * *', { timeZone: 'Asia/Jakarta' })
  async sendMorningBatchReminder() {
    await sendMessageBulk(
      this.http,
      'Cek Batch Pagi: Pastikan semua sudah Start Session (min. 2-3 jam).',
    );
  }

  @Cron('0 15 * * *', { timeZone: 'Asia/Jakarta' })
  async sendAfternoonBatchReminder() {
    await sendMessageBulk(
      this.http,
      'Cek Batch Siang: Rawan lupa! Aktifkan sesi setelah istirahat.',
    );
  }

  @Cron('0 17 * * *', { timeZone: 'Asia/Jakarta' })
  async sendFinalCheckReminder() {
    await sendMessageBulk(
      this.http,
      'Final Check: Verifikasi akhir sebelum operasional tutup.',
    );
  }
}
