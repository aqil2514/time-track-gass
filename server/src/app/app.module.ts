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
import basicAuth from 'express-basic-auth';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ImageUploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('BULL_MQ_REDIS_HOST'),
          port: parseInt(config.get<string>('BULL_MQ_REDIS_PORT')),
          password: config.get<string>('BULL_MQ_REDIS_PASSWORD'),

          maxRetriesPerRequest: null,
          connectTimeout: 30000,
          enableReadyCheck: false,

          retryStrategy: (times: number) => {
            return Math.min(times * 50, 2000);
          },
        },
      }),
    }),
    BullBoardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        route: '/queue',
        adapter: ExpressAdapter,
        middleware: basicAuth({
          challenge: true,
          users: {
            [config.get<string>('BULL_MQ_DASHBOARD_USERNAME')]:
              config.get<string>('BULL_MQ_DASHBOARD_PASSWORD'),
          },
        }),
      }),
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

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            limit: 1,
            ttl: 300000,
            blockDuration: 300000,
          },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: config.get<string>('BULL_MQ_REDIS_HOST'),
            port: parseInt(config.get<string>('BULL_MQ_REDIS_PORT')),
            password: config.get<string>('BULL_MQ_REDIS_PASSWORD'),
          }),
        ),
      }),
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
