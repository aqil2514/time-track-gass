import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ActivitiesService } from './services/activities.service';
import { UserId } from 'src/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}
  @Get('user')
  async getUserActivity(@UserId() userId: string, @Query('date') date: string) {
    return await this.service.getActivityData(userId, date);
  }

  @Get('total-work')
  async getTotalWork(@UserId() userId: string, @Query('date') date: string) {
    return await this.service.getTotalWork(userId, date);
  }

  @Get('daily')
  async getUserDailyActivity(
    @UserId() userId: string,
    @Query('date') date: string,
  ) {
    return await this.service.getDailyActivity(userId, date);
  }
}
