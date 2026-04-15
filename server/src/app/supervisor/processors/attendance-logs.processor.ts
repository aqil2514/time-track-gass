import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('attendance-logs')
export class AttendanceLogsProcessor extends WorkerHost {
  async process(job: Job) {
    const { data } = job;
    const userId: string = data.userId;

    console.log(userId);
  }
}
