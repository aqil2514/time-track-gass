import { Controller, Get, UseGuards } from '@nestjs/common';
import { TestGuard } from 'src/guards/test.guard';
import { TestBullService } from './services/test-bull.service';

@UseGuards(TestGuard)
@Controller('test')
export class TestController {
  constructor(private readonly bullService: TestBullService) {}
  @Get('/')
  async test() {
    return 'Test Controller';
  }

  @Get('/bull')
  async bullTest() {
    return await this.bullService.doSomething();
  }
}
