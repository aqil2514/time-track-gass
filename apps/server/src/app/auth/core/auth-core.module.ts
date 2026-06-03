import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthCoreController } from './auth-core.controller';
import { AuthCoreService } from './auth-core.service';

@Module({
  imports: [JwtModule],
  controllers: [AuthCoreController],
  providers: [AuthCoreService],
})
export class AuthCoreModule {}
