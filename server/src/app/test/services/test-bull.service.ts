import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from 'src/services/supabase/supabase.service';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class TestBullService {
  constructor(
    @InjectQueue('test-queue')
    private queue: Queue,

    @InjectQueue('summary-session')
    private summaryQueue: Queue,

    @InjectQueue('attendance-logs')
    private attendanceLogsQueue: Queue,

    private readonly supabaseService: SupabaseService,
  ) {}

  async getAllUser() {
    const userIdsDb: { id: string }[] = await this.supabaseService.getAllData(
      TableName.Profiles,
      'id',
    );

    return userIdsDb.map((d) => d.id);
  }

  async doSomething() {
    const job = await this.queue.add('nama-job', { data: 'Payload' });

    return {
      jobId: job.id,
      jobName: job.name,
      jobData: job.data,
    };
  }

  async testSummaryQueue() {
    const allUser = await this.getAllUser();

    for (const user of allUser) {
      await this.summaryQueue.add(
        'summary-session',
        { userId: user },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          jobId: `summary-${user}-${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}-${new Date().getHours()}`,
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    }
  }

  async testAttendanceLogs(){
    const allUser = await this.getAllUser();
    for(const user of allUser){
      this.attendanceLogsQueue.add("attendance-logs", { userId: user })
    }
  }
}
