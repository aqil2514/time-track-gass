import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { AttendanceProfileConfigService } from '../../services/attendance/attendance-profile-config.service';
import { CreateUserManagementDto } from '../../dto/attendance/profile-config.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/profile-config')
export class AttendanceProfileConfigController {
  constructor(private readonly service: AttendanceProfileConfigService) {}
  @Get()
  async getProfileWorkConfig() {
    return await this.service.getAllProfileConfig();
  }

  @Patch(':userId')
  async updateProfileWorkConfig(
    @Param('userId') userId: string,
    @Body() body: CreateUserManagementDto,
  ) {
    return await this.service.updateNewProfileConfig(body, userId);
  }
}
