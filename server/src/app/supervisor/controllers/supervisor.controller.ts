import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { SupervisorQueryDto } from '../dto/query.dto';
import { SupervisorService } from '../services/supervisor.service';
import { InjectQueue } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { Queue } from 'bullmq';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor')
export class SupervisorController {
  constructor(
    private readonly service: SupervisorService,
    @InjectQueue(QUERY_NAME.SUMMARY_SESSION)
    private summaryQueue: Queue,
  ) {}
  @Get('user-activity')
  async getUserActivity(@Query() query: SupervisorQueryDto) {
    return await this.service.getActivityData(query.user, query.date);
  }

  @Get('user-profile')
  async getAllUserProfile() {
    return await this.service.getAllUserProfile();
  }

  @Get('user-daily-insight')
  async getUserDailyInsight(@Query() query: SupervisorQueryDto) {
    return await this.service.getDailyActivity(query.user, query.date);
  }

  @Get('user-daily-percategory')
  async getUserDailyActivityPerCategory(@Query() query: SupervisorQueryDto) {
    return await this.service.getDailyActivityPerCategory(
      query.user,
      query.date,
    );
  }

  @Post('trigger/session-summary')
  async triggerSessionSummary() {
    const users = await this.service.getAllUserProfile();
    console.log('Total users:', users.length);
    console.log('Queue name:', this.summaryQueue.name);

    for (const user of users) {
      const job = await this.summaryQueue.add(
        'summary-per-session',
        { userId: user.id, username: user.username },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          // jobId: `summary-${user.id}-${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}-${new Date().getHours()}`,
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      console.log('Job added:', job.id, '| User:', user.id);
    }

    const counts = await this.summaryQueue.getJobCounts();
    console.log('Job counts:', counts);

    return { message: 'Tugas dibuat' };
  }
}
