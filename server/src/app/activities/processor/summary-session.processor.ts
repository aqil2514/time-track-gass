import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SummarySessionProcessorHelper } from './helpers/summary-session.helper';
import { Logger } from '@nestjs/common';

@Processor('summary-session')
export class SummarySessionProcessor extends WorkerHost {
  private readonly logger = new Logger(SummarySessionProcessor.name);

  constructor(private readonly helper: SummarySessionProcessorHelper) {
    super();
  }
  async process(job: Job) {
    if (process.env.NODE_ENV === 'development') return;
    
    const { data } = job;
    const userId = data.userId;

    const latestSummary = await this.helper.getLatestSummary(userId);

    const newestData = await this.helper.getNewestData(latestSummary, userId);
    if (!newestData || newestData.length === 0) return;

    const groupedData = this.helper.groupByHour(newestData);

    const finalData = [];

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
      `✅ User ${job.data.userId} - summary completed (${result?.length ?? 0} jam diproses)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - processing...`);
  }
}
