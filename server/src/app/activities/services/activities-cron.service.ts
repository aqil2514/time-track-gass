import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesSessionSummaryCronHelper } from './helpers/activites-cron-session-summary-helper.service';
import { ActivitiesDailySummaryCronHelper } from './helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesFetcherHelper } from './helpers/activities-fetcher-helper.service';
import { ActivitiesDailySummaryPerCategoryCronHelper } from './helpers/activities-cron-daily-summary-per-category.service';
import { AIScreenReportDb } from 'src/app/image-upload/interfaces/ai-screen-report.interface';
import { DailySummaryPerCategory } from '../interface/daily_summary_per_category.interface';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(
    private readonly sessionSummaryHelper: ActivitiesSessionSummaryCronHelper,
    private readonly dailySummaryHelper: ActivitiesDailySummaryCronHelper,
    private readonly dailySummaryPerCategoryHelper: ActivitiesDailySummaryPerCategoryCronHelper,
    private readonly helper: ActivitiesFetcherHelper,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    disabled: process.env.NODE_ENV === 'development',
  })
  async createNewSummary() {
    if (process.env.NODE_ENV === 'development') return;

    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const oneHourBefore = new Date(hourStart.getTime() - 60 * 60 * 1000);
    const nextHourStart = new Date(hourStart.getTime() + 60 * 60 * 1000);

    await this.generateSessionSummary(oneHourBefore, nextHourStart);
  }

  async generateSessionSummary(from: Date, to: Date) {
    try {
      const allUser = await this.sessionSummaryHelper.getAllUser();

      const oneHourActivites =
        await this.sessionSummaryHelper.getDuringOneHourActivities(
          from,
          to,
          allUser,
        );

      if (oneHourActivites.length === 0) {
        this.logger.log(
          `No activities found from ${from.toISOString()} to ${to.toISOString()}`,
        );
        return;
      }

      const mappedData =
        await this.sessionSummaryHelper.mapToSessionSummaryDbInsert(
          oneHourActivites,
        );

      await this.sessionSummaryHelper.createNewSessionSummary(mappedData);
      this.logger.log(
        `Session summary generated for ${mappedData.length} entries from ${from.toISOString()} to ${to.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate session summary: ${error.message}`);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummary() {
    const allUser = await this.sessionSummaryHelper.getAllUser();

    const summariesData =
      await this.dailySummaryHelper.getSessionActivityByUserId(allUser);

    const allRawIds = summariesData.flatMap((data) => data.raw_ids);

    const allReports = await this.helper.getRawActivityRawIds(allRawIds);

    const data = this.helper.mapToActivityData(allReports, summariesData);

    const mappedData =
      await this.dailySummaryHelper.mapToDailySummaryDbInsert(data);

    await this.dailySummaryHelper.createNewDailySummary(mappedData);

    this.logger.log(`Daily summary generated for ${mappedData.length} entries`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Asia/Jakarta',
  })
  async createDailySummaryPerCategory() {
    this.logger.log('Memanggil fungsi buat summary daily per kategori');

    const [allUser, allCategories] = await Promise.all([
      this.sessionSummaryHelper.getAllUser(),
      this.dailySummaryPerCategoryHelper.getAllCategories(),
    ]);

    this.logger.log(`Jumlah user : ${allUser.length}`);
    this.logger.log(`Jumlah kategori : ${allCategories.length}`);

    this.logger.log(`Mencari data aktivitas dari ${allUser.length} user...`);
    const userActivites =
      await this.dailySummaryPerCategoryHelper.getUserDailyActivity(allUser);

    this.logger.log(`Data aktivitas dari ${allUser.length} ditemukan`);
    const userMap = new Map<string, AIScreenReportDb[]>();

    this.logger.log(`memulai mapping...`);
    for (const activity of userActivites) {
      const existing = userMap.get(activity.user_id);

      existing
        ? existing.push(activity)
        : userMap.set(activity.user_id, [activity]);
    }

    this.logger.log(
      `Mapping selesai. Terdapat ${userMap.size} data setelah dimapping`,
    );

    this.logger.log("Menganalisis dengan AI")
    const userMapEntries = userMap.entries();

    const finalResult:DailySummaryPerCategory[] = []

    let i = 1;
    for (const [userId, data] of userMapEntries){
      this.logger.log(`Menganalisis user ${i} dari ${userMap.size}...`);
      const summary = await this.dailySummaryPerCategoryHelper.getDailyAiSummary(data, allCategories,userId);
      finalResult.push(...summary)
      i++
    }

    this.logger.log("Analisis oleh AI selesai, lanjut simpan ke database")

    await this.dailySummaryPerCategoryHelper.saveToDb(finalResult);
    
    this.logger.log("Berhasil simpan ke database")
  }
}
