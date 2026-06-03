import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserId } from 'src/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { AppLogInsertClient } from './log.interface';
import { LogService } from './log.service';

@UseGuards(JwtAuthGuard)
@Controller('log')
export class LogController {
  constructor(private readonly service: LogService) {}
  @Post()
  async createNewLog(
    @UserId() userId: string,
    @Body() payload: AppLogInsertClient,
  ) {
    await this.service.createNewLog(userId, payload);
    return { success: true };
  }
}
