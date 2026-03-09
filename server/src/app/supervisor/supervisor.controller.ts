import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from './dto/query.dto';
import { SupervisorService } from './services/supervisor.service';
import { ActivitiesCronService } from '../activities/services/activities-cron.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor')
export class SupervisorController {
  constructor(
    private readonly service: SupervisorService,
    private readonly cronService: ActivitiesCronService,
  ) {}
  @Get('user-activity')
  async getUserActivity(@Query() query: SupervisorQueryDto) {
    return await this.service.getActivityData(query.user, query.date);
  }

  @Get('user-profile')
  async getAllUserProfile() {
    return await this.service.getAllUserProfile();
  }

  @Get('user-daily-insight')
  async getUserDailyInsight(@Query() query: SupervisorQueryDto) {
    return await this.service.getDailyActivity(query.user, query.date);
  }

  @Post('trigger/session-summary')
  async triggerSessionSummary(@Body() body: { from: string; to: string }) {
    return await this.cronService.generateSessionSummary(
      new Date(body.from),
      new Date(body.to),
    );
  }
}
