import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorDivisionsService } from '../services/supervisor-division.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/division')
export class SupervisorDivisionsController {
  constructor(private readonly service: SupervisorDivisionsService) {}
  
  @Get()
  async getAllDivision() {
    return await this.service.getAllDivision();
  }
}
