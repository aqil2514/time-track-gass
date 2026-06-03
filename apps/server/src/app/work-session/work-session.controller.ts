import { Controller, Post, UseGuards } from '@nestjs/common';
import { UserId } from 'src/decorators/user-id.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { WorkSessionService } from './work-session.service';

@UseGuards(JwtAuthGuard)
@Controller('work-session')
export class WorkSessionController {
  constructor(private readonly service: WorkSessionService) {}
  @Post('start')
  async startWorkSession(@UserId() userId: string) {
    await this.service.createNewWorkSession(userId);
    return { success: true };
  }

  @Post('end')
  async endWorkSession(@UserId() userId: string) {
    await this.service.endCurrentWorkSession(userId, new Date(), 'manual');
    return { success: true };
  }
}
