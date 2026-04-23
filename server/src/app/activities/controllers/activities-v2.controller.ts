import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserId } from 'src/decorators/user-id.decorator';
import { ActivitiesService } from '../services/activities.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('activities/v2')
export class ActivitiesV2Controller {
  constructor(private readonly service: ActivitiesService) {}
  @Get('')
  async getActivitiesV2(@UserId() userId: string, @Query('date') date: string) {
    const [dailyActivity, activityData, totalWork] = await Promise.all([
      this.service.getDailyActivity(userId, date),
      this.service.getActivityData(userId, date),
      this.service.getTotalWork(userId, date),
    ]);

    return {
      dailyActivity,
      activityData,
      totalWork,
    };
  }
}
