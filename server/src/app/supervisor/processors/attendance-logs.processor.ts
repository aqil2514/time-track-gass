import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { Job } from 'bullmq';
import { RPCFunctionName } from 'src/services/supabase/supabase.interface';

@Processor('attendance-logs')
export class AttendanceLogsProcessor extends WorkerHost {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {
    super();
  }
  async process(job: Job) {
    const { data } = job;
    const { data: rpcData, error } = await this.supabase.rpc(
      RPCFunctionName.GET_SCREEN_REPORT_YESTERDAY,
    );

    console.log(data);
    console.log(rpcData);

    if (error) {
      console.error(error);
      throw error;
    }

    return rpcData
  }
}
