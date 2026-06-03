import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthMapperService } from './services/auth-mapper.service';
import { AuthService } from './services/auth.service';
import { AuthFetcherService } from './services/auth-fetcher.service';
import { AuthSettingController } from './controller/auth-setting.controller';
import { AuthSettingTrackerService } from './services/settings/auth-setting-tracker.service';
import { AuthSettingService } from './services/settings/auth-setting.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController, AuthSettingController],
  providers: [
    AuthService,
    AuthMapperService,
    AuthFetcherService,

    // Setting
    AuthSettingService,
    AuthSettingTrackerService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
