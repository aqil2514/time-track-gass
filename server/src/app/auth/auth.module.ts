import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthMapperService } from './services/auth-mapper.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthMapperService],
})
export class AuthModule {}
