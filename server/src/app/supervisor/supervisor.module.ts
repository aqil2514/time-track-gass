import { Module } from '@nestjs/common';
import { SupervisorController } from './supervisor.controller';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';

@Module({
  controllers: [SupervisorController],
  providers: [JwtAuthSupervisorGuard, RoleGuard],
})
export class SupervisorModule {}