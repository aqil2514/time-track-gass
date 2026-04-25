import { Global, Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { LogService } from './log.service';

@Global()
@Module({
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
