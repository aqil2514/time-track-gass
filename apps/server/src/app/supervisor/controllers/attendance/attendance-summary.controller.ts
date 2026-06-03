import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { AttendanceSummaryService } from '../../services/attendance/attendance-summary.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/summary')
export class AttendanceSummaryController {
  constructor(private readonly service: AttendanceSummaryService) {}

  @Get('')
  async getAttendanceSummary(@Query() query: AttendanceLogsQueryDto) {
    return this.service.getAttendanceSummary(query);
  }

  @Get(':userId')
  async getAttendanceSummaryDetail(@Query() query: AttendanceLogsQueryDto, @Param("userId") userId:string){
    return await this.service.getAttendanceSummaryDetail(query, userId)
  }
}
