import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SupervisorUserService } from '../services/supervisor-user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserSettingsDto } from '../dto/user-settings.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/user')
export class SupervisorUserController {
  constructor(private readonly supervisorUserService: SupervisorUserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.createUserData(createUserDto);
  }

  @Get()
  async findAll(): Promise<ProfilesWithNoPassword[]> {
    return this.supervisorUserService.getAllUserData();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.getUserById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.updateUserData(id, updateUserDto);
  }

  @Patch(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return await this.supervisorUserService.markUserMustResetPassword(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.supervisorUserService.deleteUserData(id);
  }

  @Get(':id/settings')
  async getUserSetting(@Param('id') id: string) {
    const userSetting = await this.supervisorUserService.getUserSetting(id);
    return userSetting;
  }

  @Patch(':id/settings')
  async updateUserSetting(
    @Param('id') id: string,
    @Body() body: UserSettingsDto,
  ) {
    await this.supervisorUserService.updateUserSetting(id, body);
    return { success: true };
  }
}
