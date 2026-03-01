import { Global, Module } from '@nestjs/common';
import { ZAIService } from './ai-z.service';

@Global()
@Module({
  providers: [ZAIService],
  exports: [ZAIService],
})
export class ZAIModule {}
