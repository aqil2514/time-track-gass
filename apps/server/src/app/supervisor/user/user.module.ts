import { Module } from '@nestjs/common';
import { UserCoreModule } from './core/user-core.module';
import { UserSettingsModule } from './settings/user-settings.module';

@Module({
  imports: [UserCoreModule, UserSettingsModule],
})
export class UserModule {}
