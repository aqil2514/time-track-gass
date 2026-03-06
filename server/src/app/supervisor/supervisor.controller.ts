import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from './dto/query.dto';
import { SupervisorService } from './services/supervisor.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly service: SupervisorService) {}
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
}
