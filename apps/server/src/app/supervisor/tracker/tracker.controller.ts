import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from '../_dto/query.dto';
import { TrackerService } from './tracker.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/tracker')
export class TrackerController {
  constructor(private readonly service: TrackerService) {}

  @Get()
  async getTrackerActivity(@Query() query: SupervisorQueryDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    return this.service.getTrackerActivityData(query.user, query.date, page, limit, query.from, query.to);
  }

  @Get('matrix')
  async getTrackerMatrix(@Query() query: SupervisorQueryDto) {
    return this.service.getTrackerMatrix(query.date);
  }

  @Get('matrix/range')
  async getTrackerMatrixRange(@Query() query: SupervisorQueryDto) {
    return this.service.getTrackerMatrixRange(query.from, query.to);
  }

  @Get('id/:id')
  async getTrackerById(@Param('id') id: string) {
    return this.service.getTrackerByActivityId(id);
  }
}
