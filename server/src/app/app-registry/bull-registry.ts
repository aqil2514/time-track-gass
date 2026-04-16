import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import basicAuth from 'express-basic-auth';

export const BULL_QUEUE_REGISTRY = [
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
  BullBoardModule.forFeature({
    name: 'summary-session',
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: 'attendance-logs',
    adapter: BullMQAdapter,
  }),
];
