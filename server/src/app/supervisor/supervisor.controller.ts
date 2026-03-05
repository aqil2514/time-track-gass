import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';

// TODO : Next lanjut ke sini

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor')
export class SupervisorController {
  @Get('user-activity')
  async getUserActivity(@Query() query: { user: string; date: string }) {
    return { message: 'K' };
  }
}
