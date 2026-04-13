import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('test-queue')
export class TestBullProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    console.log('Job diterima:', job.name);
    console.log('Job data:', job.data);

    throw new Error('Simulasi error!');
  }
}
