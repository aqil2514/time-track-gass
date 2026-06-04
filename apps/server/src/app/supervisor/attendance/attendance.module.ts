import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ListNoteModule } from './list-note/list-note.module';
import { ProfileConfigModule } from './profile-config/profile-config.module';
import { SummaryModule } from './summary/summary.module';
import { AdjustmentModule } from './adjustment/adjustment.module';
import { AttendanceLogsProcessor } from './attendance-logs.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'attendance-logs' }),
    ListNoteModule,
    ProfileConfigModule,
    SummaryModule,
    AdjustmentModule,
  ],
  providers: [AttendanceLogsProcessor],
})
export class AttendanceModule {}
