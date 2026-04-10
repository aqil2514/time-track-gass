import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TestBullService {
  constructor(
    @InjectQueue('test-queue')
    private queue: Queue,
  ) {}

  async doSomething() {
    const job = await this.queue.add('nama-job', { data: 'Payload' });

    return {
      jobId: job.id,
      jobName: job.name,
      jobData: job.data,
    };
  }
}
