import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { SupervisorQueryDto } from './_dto/query.dto';
import { SupervisorService } from './supervisor.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor')
export class SupervisorController {
  constructor(
    private readonly service: SupervisorService,
    @InjectQueue(QUERY_NAME.SUMMARY_SESSION) private summaryQueue: Queue,
  ) {}

  @Get('user-activity')
  async getUserActivity(@Query() query: SupervisorQueryDto) {
    return this.service.getActivityData(query.user, query);
  }

  @Get('user-profile')
  async getAllUserProfile() {
    return this.service.getAllUserProfiles();
  }

  @Get('user-daily-insight')
  async getUserDailyInsight(@Query() query: SupervisorQueryDto) {
    return this.service.getDailyActivity(query.user, query);
  }

  @Get('user-daily-percategory')
  async getUserDailyActivityPerCategory(@Query() query: SupervisorQueryDto) {
    return this.service.getDailyActivityPerCategory(query.user, query);
  }

  @Post('trigger/session-summary')
  async triggerSessionSummary() {
    // Step 1: Ambil semua user aktif
    const users = await this.service.getAllUserProfiles();

    // Step 2: Buat job per user ke queue
    for (const user of users) {
      await this.summaryQueue.add(
        'summary-per-session',
        { userId: user.id, username: user.username },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
    }

    return { message: 'Tugas dibuat' };
  }
}
