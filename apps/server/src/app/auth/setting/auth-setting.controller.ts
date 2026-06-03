import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserId } from 'src/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { AuthSettingService } from './auth-setting.service';

@UseGuards(JwtAuthGuard)
@Controller('auth/setting')
export class AuthSettingController {
  constructor(private readonly service: AuthSettingService) {}

  @Get('')
  async getUserSetting(@UserId() userId: string) {
    return await this.service.getUserSetting(userId);
  }

  @Patch('/tracker')
  async updateTrackerMode(
    @UserId() userId: string,
    @Body() body: { newValue: string },
  ) {
    await this.service.updateTrackerMode(userId, body.newValue);
    return { success: true };
  }
}
