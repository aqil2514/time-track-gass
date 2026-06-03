import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserId } from 'src/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { AuthSettingService } from '../services/settings/auth-setting.service';
import { AuthSettingTrackerService } from '../services/settings/auth-setting-tracker.service';

@UseGuards(JwtAuthGuard)
@Controller('auth/setting')
export class AuthSettingController {
  constructor(
    private readonly settingService: AuthSettingService,
    private readonly trackerSettingService: AuthSettingTrackerService,
  ) {}
  @Get('')
  async getUserSetting(@UserId() userId: string) {
    return await this.settingService.getUserSettingById(userId);
  }

  @Patch('/tracker')
  async updateTrackerMode(
    @UserId() userId: string,
    @Body() body: { newValue: string },
  ) {
    await this.trackerSettingService.updateTrackerMode(userId, body.newValue);
    return { success: true };
  }
}
