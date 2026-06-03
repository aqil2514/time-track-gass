import { Module } from '@nestjs/common';
import { AuthSettingController } from './auth-setting.controller';
import { AuthSettingService } from './auth-setting.service';

@Module({
  controllers: [AuthSettingController],
  providers: [AuthSettingService],
})
export class AuthSettingModule {}
