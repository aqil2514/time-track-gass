import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { ActivityService } from './activity.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/activity')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Patch('delete')
  async softDelete(@Body() activityIds: string[]) {
    return this.service.softDeleteActivity(activityIds);
  }

  @Patch('category')
  async bulkEditCategory(
    @Body() body: { activityIds: string[]; newCategory: string },
  ) {
    return this.service.bulkEditCategory(body.activityIds, body.newCategory);
  }
}
