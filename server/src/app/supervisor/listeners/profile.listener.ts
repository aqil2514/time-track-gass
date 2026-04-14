import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProfilesDbInsert } from 'src/app/auth/interfaces/profiles.interface';
import { ProfileListenerHelper } from './helpers/profile.listener-helper';

@Injectable()
export class ProfileListenerEvent {
  private readonly logger = new Logger(ProfileListenerEvent.name);

  constructor(private readonly helper: ProfileListenerHelper) {}

  @OnEvent('profile.created')
  async handleCreatedProfile(payload: ProfilesDbInsert) {
    this.logger.log('User baru dibuat! Memicu beberapa proses setelahnya...');
    await this.helper.createNewProfileWorkConfig(payload);
  }

  @OnEvent("profile.deleted")
  async handleDeletedProfile(userId:string){
    this.logger.log("User dihapus! Melakukan beberapa pembersihan data terkait user")
    await this.helper.deleteProfileWorkConfig(userId)
  }
}
