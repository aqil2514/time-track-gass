import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorDivisionsService } from '../services/supervisor-division.service';
import { CreateDivisionDto } from '../dto/create-division.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/division')
export class SupervisorDivisionsController {
  constructor(private readonly service: SupervisorDivisionsService) {}

  @Get()
  async getAllDivision() {
    return await this.service.getAllDivision();
  }

  @Post()
  async createNewDivision(@Body() body: CreateDivisionDto) {
    return await this.service.createNewDivision(body)
  }
}
