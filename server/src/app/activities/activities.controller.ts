import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ActivitiesService } from './services/activities.service';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly service:ActivitiesService
  ){}
  @Get('user')
  async getUserActivity(@Req() req: any) {
    const user = req.user;
    const userId = user.user.id;
    return await this.service.getActivityByUserId(userId);
  }
}
