import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { BullModule } from '@nestjs/bullmq';
import { TestBullService } from './services/test-bull.service';
import { TestBullProcessor } from './processor/test-bull.processor';
import { HttpModule } from '@nestjs/axios';
import { TestAxiosService } from './services/test-axios.service';
import { QUERY_NAME } from 'src/constants/queue.constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'test-queue',
    }),
    BullModule.registerQueue({
      name: QUERY_NAME.SUMMARY_SESSION,
    }),
    BullModule.registerQueue({
      name: 'attendance-logs',
    }),

    HttpModule
  ],
  providers: [TestBullService, TestBullProcessor, TestAxiosService],
  controllers: [TestController],
})
export class TestModule {}
