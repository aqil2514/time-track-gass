import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from '../dto/query.dto';
import { SupervisorTrackerService } from '../services/supervisor-tracker.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/tracker')
export class SupervisorTrackerController {
  constructor(private readonly trackerService: SupervisorTrackerService) {}

  @Get('')
  async getTrackerActivity(@Query() query: SupervisorQueryDto) {
    return await this.trackerService.getTrackerActivityData(
      query.user,
      query.date,
    );
  }

  @Get("id/:id")
  async getTrackerById(@Param("id") id:string){
    return await this.trackerService.getTrackerByActivityId(id)
  }
}
