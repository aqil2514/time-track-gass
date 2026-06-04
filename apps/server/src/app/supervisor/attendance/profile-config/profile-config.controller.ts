import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateUserManagementDto } from '../../_dto/attendance/profile-config.dto';
import { ProfileConfigService } from './profile-config.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/profile-config')
export class ProfileConfigController {
  constructor(private readonly service: ProfileConfigService) {}

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Patch(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() body: CreateUserManagementDto,
  ) {
    return this.service.update(body, userId);
  }
}
