import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserCoreService } from './user-core.service';
import { CreateUserDto } from '../../_dto/create-user.dto';
import { UpdateUserDto } from '../../_dto/update-user.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/user')
export class UserCoreController {
  constructor(private readonly service: UserCoreService) {}

  @Get()
  async getAllUsers() {
    return this.service.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.service.getUserById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    return this.service.createUser(body);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.service.updateUser(id, body);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.service.deleteUser(id);
  }

  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.service.markMustResetPassword(id);
  }
}
