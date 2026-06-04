import { Module } from '@nestjs/common';
import { ProfileConfigController } from './profile-config.controller';
import { ProfileConfigService } from './profile-config.service';

@Module({
  controllers: [ProfileConfigController],
  providers: [ProfileConfigService],
})
export class ProfileConfigModule {}
