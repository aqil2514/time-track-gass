import { Controller, Get, UseGuards } from '@nestjs/common';
import { TestGuard } from 'src/guards/test.guard';
import { TestBullService } from './services/test-bull.service';
import { ActivitiesSummaryCronService } from '../activities/cron/activities-summary.cron';
import { TestAxiosService } from './services/test-axios.service';
import { TestGeminiService } from './services/test-gemini.service';

@UseGuards(TestGuard)
@Controller('test')
export class TestController {
  constructor(
    private readonly bullService: TestBullService,
    private readonly cronTest: ActivitiesSummaryCronService,
    private readonly axiosTest: TestAxiosService,
    private readonly geminiTest: TestGeminiService,
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
    await this.cronTest.createDailySummary();
    return {
      message: 'Tugas Ditambah',
    };
  }

  // @Get('/daily-summary-category')
  // async bullDailySummaryCategory() {
  //   await this.cronTest.createDailySummaryPerCategory();
  //   return {
  //     message: 'Tugas Ditambah',
  //   };
  // }

  @Get('/axios')
  async sendMessage() {
    return this.axiosTest.sendMessage();
  }

  @Get('/summary-session')
  async summarySession() {
    await this.bullService.testSummaryQueue();
    return 'OK';
  }

  @Get('daily-summary-category')
  async dailySummaryCategoryTest() {
    await this.bullService.testDailySummaryCategoryQueue();
    return { message: 'OK' };
  }

  @Get('/attendance-logs')
  async testAttendanceLogs() {
    await this.bullService.testAttendanceLogs();
    return 'OK';
  }

  @Get('/daily-summary')
  async testDailySummary() {}

  // GEMINI
  @Get('gemini')
  async testGemini() {
    return await this.geminiTest.testGeminiVideo();
  }
}
