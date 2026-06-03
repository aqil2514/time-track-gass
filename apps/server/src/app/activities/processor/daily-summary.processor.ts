import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ActivitiesDailySummaryCronHelper } from '../services/helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesFetcherHelper } from '../services/helpers/activities-fetcher-helper.service';
import { Logger } from '@nestjs/common';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Processor(QUERY_NAME.DAILY_SUMMARY)
export class DailySummaryProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySummaryProcessor.name);

  constructor(
    private readonly dailySummaryHelper: ActivitiesDailySummaryCronHelper,
    private readonly helper: ActivitiesFetcherHelper,
  ) {
    super();
  }
  async process(job: Job) {
    const { userId } = job.data;

    const summariesData =
      await this.dailySummaryHelper.getSessionActivityByUserId([userId]);

    const report = await this.helper.getRawActivityRawIds([userId]);

    const data = this.helper.mapToActivityData(report, summariesData);

    const mappedData =
      await this.dailySummaryHelper.mapToDailySummaryDbInsert(data);

      await this.dailySummaryHelper.createNewDailySummary(mappedData);
      return mappedData
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ User ${job.data.userId} - summary completed`);
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
