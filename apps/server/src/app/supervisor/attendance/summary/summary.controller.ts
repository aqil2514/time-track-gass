import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { SummaryService } from './summary.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/summary')
export class SummaryController {
  constructor(private readonly service: SummaryService) {}

  @Get()
  async getSummary(@Query() query: AttendanceLogsQueryDto) {
    return this.service.getSummary(query);
  }

  @Get(':userId')
  async getSummaryDetail(
    @Query() query: AttendanceLogsQueryDto,
    @Param('userId') userId: string,
  ) {
    return this.service.getSummaryDetail(query, userId);
  }
}
