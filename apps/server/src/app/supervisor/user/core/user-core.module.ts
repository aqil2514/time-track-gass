import { Module } from '@nestjs/common';
import { UserCoreController } from './user-core.controller';
import { UserCoreService } from './user-core.service';
import { ProfileListenerEvent } from './listeners/profile.listener';
import { ProfileListenerHelper } from './listeners/profile.listener.helper';

@Module({
  controllers: [UserCoreController],
  providers: [UserCoreService, ProfileListenerEvent, ProfileListenerHelper],
})
export class UserCoreModule {}
