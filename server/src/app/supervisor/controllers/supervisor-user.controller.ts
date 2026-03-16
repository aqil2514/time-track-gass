import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorUserService } from '../services/supervisor-user.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/user')
export class SupervisorUserController {
  constructor(
    private readonly supervisorUserService: SupervisorUserService,
  ) {}

  @Get("")
  async getAllUserData() {
    return await this.supervisorUserService.getAllUserData();
  }
}