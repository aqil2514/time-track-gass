import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateAttendanceAdjustmentDto } from '../../dto/attendance/adjustment.dto';
import { AttendanceAdjustmentService } from '../../services/attendance/attendance-adjustment.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/adjustment')
export class AttendanceAdjustmentController {
  constructor(private readonly service: AttendanceAdjustmentService) {}
  
  @Post('')
  async createNewAdjustment(@Body() body: CreateAttendanceAdjustmentDto) {
    return await this.service.createNewAdjusment(body);
  }
}
