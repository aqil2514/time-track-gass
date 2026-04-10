import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIGeminiModule } from '../services/ai-gemini/ai-gemini.module';
import { ZAIModule } from '../services/ai-z/ai-z.module';
import { SupabaseModule } from '../services/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SupervisorModule } from './supervisor/supervisor.module';
import { AWSS3Module } from 'src/services/aws-s3/aws-s3.module';
import { TestModule } from './test/test.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ImageUploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('BULL_MQ_REDIS_HOST'),
          port: parseInt(config.get<string>('BULL_MQ_REDIS_PORT')),
          password: config.get<string>('BULL_MQ_REDIS_PASSWORD'),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/queue',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'test-queue',
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'daily-summary-queue',
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'daily-category-summary-queue',
      adapter: BullMQAdapter,
    }),
    TestModule,

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
