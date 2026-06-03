import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SummarySessionProcessorHelper } from './helpers/summary-session.helper';
import { Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Processor(QUERY_NAME.SUMMARY_SESSION)
export class SummarySessionProcessor extends WorkerHost {
  private readonly logger = new Logger(SummarySessionProcessor.name);

  constructor(private readonly helper: SummarySessionProcessorHelper) {
    super();
  }
  async process(job: Job) {
    const { data } = job;
    const userId = data.userId;

    this.logger.log('Mengambil hasil ringkasan terakhir...');
    const latestSummary = await this.helper.getLatestSummary(userId);

    this.logger.log('Mengambil data terbaru...');
    const newestData = await this.helper.getNewestData(latestSummary, userId);
    if (!newestData || newestData.length === 0) {
      this.logger.log(
        'Data terbaru tidak ditemukan. Ringkasan telah dilakukan',
      );
      return;
    }

    this.logger.log('Mengelompokkan jadi per jam');
    const groupedData = this.helper.groupByHour(newestData);

    const finalData = [];

    this.logger.log(
      'Melakukan analisis oleh AI dan menambahkannya ke database...',
    );
    for (const [hourKey, items] of Object.entries(groupedData)) {
      const mapped = await this.helper.mapToSessionSummaryDbInsert(
        userId,
        hourKey,
        items,
      );

      await this.helper.createNewSessionSummary(mapped);
      finalData.push(mapped);
    }

    return finalData;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    const result = job.returnvalue;
    this.logger.log(
      `✅ User ${job.data.userId} - Ringkasan selesai (${result?.length ?? 0} jam diproses)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} - gagal: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - sedang diproses...`);
  }
}
