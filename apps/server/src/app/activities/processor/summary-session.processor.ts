import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { AnalyzerService } from 'src/services/analyzer/services/analyzer.service';
import { QUERY_NAME } from 'src/constants/queue.constant';
import {
  getLatestSummary,
  getNewestData,
  groupByHour,
  mapToSessionSummaryDbInsert,
  createNewSessionSummary,
} from 'src/helpers/activities/processor/summarySession.helper';

@Processor(QUERY_NAME.SUMMARY_SESSION)
export class SummarySessionProcessor extends WorkerHost {
  private readonly logger = new Logger(SummarySessionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyzer: AnalyzerService,
  ) {
    super();
  }

  async process(job: Job) {
    const userId = job.data.userId;

    // Step 1: Ambil ringkasan terakhir
    this.logger.log('Mengambil hasil ringkasan terakhir...');
    const latestSummary = await getLatestSummary(this.prisma, userId);

    // Step 2: Ambil data terbaru
    this.logger.log('Mengambil data terbaru...');
    const newestData = await getNewestData(this.prisma, latestSummary, userId);
    if (!newestData || newestData.length === 0) {
      this.logger.log('Data terbaru tidak ditemukan. Ringkasan telah dilakukan');
      return;
    }

    // Step 3: Kelompokkan per jam
    this.logger.log('Mengelompokkan jadi per jam');
    const groupedData = groupByHour(newestData);

    // Step 4: Analisis AI dan simpan ke DB
    this.logger.log('Melakukan analisis oleh AI dan menambahkannya ke database...');
    const finalData = [];
    for (const [hourKey, items] of Object.entries(groupedData)) {
      const mapped = await mapToSessionSummaryDbInsert(
        this.analyzer,
        userId,
        hourKey,
        items,
      );
      await createNewSessionSummary(this.prisma, mapped);
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
