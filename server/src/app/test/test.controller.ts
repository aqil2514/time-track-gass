import { Controller, Get, UseGuards } from '@nestjs/common';
import { TestGuard } from 'src/guards/test.guard';
import { TestBullService } from './services/test-bull.service';
import { ActivitiesCronService } from '../activities/services/activities-cron.service';

@UseGuards(TestGuard)
@Controller('test')
export class TestController {
  constructor(
    private readonly bullService: TestBullService,
    private readonly cronTest: ActivitiesCronService,
  ) {}
  @Get('/')
  async test() {
    return 'Test Controller';
  }

  @Get('/bull')
  async bullTest() {
    return await this.bullService.doSomething();
  }

  @Get('/daily-summary')
  async bullDailySummary() {
    await this.cronTest.createDailySummary()
    return {
      message: 'Tugas Ditambah',
    };
  }
}
