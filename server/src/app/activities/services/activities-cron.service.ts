import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ActivitiesCronHelper } from './helpers/activites-cron-helper.service';

@Injectable()
export class ActivitiesCronService {
  private logger = new Logger(ActivitiesCronService.name);
  constructor(private readonly helper: ActivitiesCronHelper) {}

  // @Cron(CronExpression.EVERY_HOUR)
  @Cron(CronExpression.EVERY_10_SECONDS)
  async createNewSummary() {
    const now = new Date();

    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const oneHourBefore = new Date(hourStart.getTime() - 60 * 60 * 1000);
    const nextHourStart = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const allUser = await this.helper.getAllUser();

    const oneHourActivites = await this.helper.getDuringOneHourActivities(
      oneHourBefore,
      nextHourStart,
      allUser,
    );

    if (oneHourActivites.length === 0) return;

    const mappedData =
      await this.helper.mapToSessionSummaryDbInsert(oneHourActivites);

    // await this.helper.createNewSessionSummary(mappedData);
    // this.logger.log(
    //   `Session summary generated for ${mappedData.length} entries from ${oneHourBefore.toISOString()} to ${nextHourStart.toISOString()}`,
    // );
  }
}
