import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/services/prisma/prisma.service';

interface ScreenReportYesterday {
  user_id: string;
  date: string;
  count: number;
  total_work_time: number;
}

@Processor('attendance-logs')
@Injectable()
export class AttendanceLogsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const result = await this.prisma.$queryRaw<ScreenReportYesterday[]>`
      SELECT
        asr.user_id,
        DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') AS date,
        COUNT(*) AS count,
        SUM(asr."interval") AS total_work_time
      FROM ai_screen_report asr
      WHERE
        DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE - 1
        AND asr.category <> 'unclassified'
      GROUP BY asr.user_id, DATE(asr.created_at AT TIME ZONE 'Asia/Jakarta')
    `;

    return result.map((row) => ({
      ...row,
      count: Number(row.count),
      total_work_time: Number(row.total_work_time),
    }));
  }
}
