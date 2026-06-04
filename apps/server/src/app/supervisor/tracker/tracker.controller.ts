import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from '../dto/query.dto';
import { TrackerService } from './tracker.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/tracker')
export class TrackerController {
  constructor(private readonly service: TrackerService) {}

  @Get()
  async getTrackerActivity(@Query() query: SupervisorQueryDto) {
    return this.service.getTrackerActivityData(query.user, query.date);
  }

  @Get('matrix')
  async getTrackerMatrix(@Query() query: SupervisorQueryDto) {
    return this.service.getTrackerMatrix(query.date);
  }

  @Get('id/:id')
  async getTrackerById(@Param('id') id: string) {
    return this.service.getTrackerByActivityId(id);
  }
}
