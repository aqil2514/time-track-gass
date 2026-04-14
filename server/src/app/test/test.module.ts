import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { BullModule } from '@nestjs/bullmq';
import { TestBullService } from './services/test-bull.service';
import { TestBullProcessor } from './processor/test-bull.processor';
import { HttpModule } from '@nestjs/axios';
import { TestAxiosService } from './services/test-axios.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'test-queue',
    }),
    BullModule.registerQueue({
      name: 'summary-session',
    }),

    HttpModule
  ],
  providers: [TestBullService, TestBullProcessor, TestAxiosService],
  controllers: [TestController],
})
export class TestModule {}
