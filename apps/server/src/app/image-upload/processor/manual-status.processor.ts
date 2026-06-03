import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Processor(QUERY_NAME.MANUAL_SLOT_STATUS)
export class ManualStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(ManualStatusProcessor.name);

  async process() {
    return { status: 'all-success' };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} - Foto berhasil dianalisis`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ User ${job.data.userId} - failed: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`⏳ User ${job.data.userId} - sedang diproses...`);
  }
}
