import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsDto } from '../../_dto/user-settings.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/user')
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get(':id/settings')
  async getUserSettings(@Param('id') id: string) {
    return this.service.getUserSettings(id);
  }

  @Patch(':id/settings')
  async updateUserSettings(
    @Param('id') id: string,
    @Body() body: UserSettingsDto,
  ) {
    return this.service.updateUserSettings(id, body);
  }
}
