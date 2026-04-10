import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { BullModule } from '@nestjs/bullmq';
import { TestBullService } from './services/test-bull.service';
import { TestBullProcessor } from './services/test-bull.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'test-queue',
    }),
  ],
  providers: [TestBullService, TestBullProcessor],
  controllers: [TestController],
})
export class TestModule {}
