import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorACtivityService } from '../services/supervisor-activity.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/activity')
export class SupervisorActivityController {
  constructor(private readonly service: SupervisorACtivityService) {}
  
  @Patch('delete')
  async softDelete(@Body() activityIds: string[]) {
    return await this.service.softDeleteActivity(activityIds);
  }
}
