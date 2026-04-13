import { Controller, Get, UseGuards } from '@nestjs/common';
import { TestGuard } from 'src/guards/test.guard';
import { TestBullService } from './services/test-bull.service';
import { ActivitiesCronService } from '../activities/services/activities-cron.service';
import { TestAxiosService } from './services/test-axios.service';

@UseGuards(TestGuard)
@Controller('test')
export class TestController {
  constructor(
    private readonly bullService: TestBullService,
    private readonly cronTest: ActivitiesCronService,
    private readonly axiosTest: TestAxiosService
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

  @Get('/daily-summary-category')
  async bullDailySummaryCategory() {
    await this.cronTest.createDailySummaryPerCategory()
    return {
      message: 'Tugas Ditambah',
    };
  }

  @Get("/axios")
  async sendMessage(){
    return this.axiosTest.sendMessage()
  }
}
