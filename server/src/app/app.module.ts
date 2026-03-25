import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AIGeminiModule } from '../services/ai-gemini/ai-gemini.module';
import { ZAIModule } from '../services/ai-z/ai-z.module';
import { SupabaseModule } from '../services/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SupervisorModule } from './supervisor/supervisor.module';
import { AWSS3Module } from 'src/services/aws-s3/aws-s3.module';
import { ActivitiesDailySummaryCronHelper } from './activities/services/helpers/activites-cron-daily-summary-helper.service';
import { ActivitiesSessionSummaryCronHelper } from './activities/services/helpers/activites-cron-session-summary-helper.service';
import { ActivitiesFetcherHelper } from './activities/services/helpers/activities-fetcher-helper.service';
import { ActivitiesDailySummaryPerCategoryCronHelper } from './activities/services/helpers/activities-cron-daily-summary-per-category.service';

@Module({
  imports: [
    ImageUploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    AIGeminiModule,
    ZAIModule,
    SupabaseModule,
    AuthModule,
    ActivitiesModule,
    SupervisorModule,
    AWSS3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
