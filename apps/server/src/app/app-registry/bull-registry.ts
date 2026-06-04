import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import basicAuth from 'express-basic-auth';
import { QUERY_NAME } from 'src/constants/queue.constant';

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
    name: QUERY_NAME.DAILY_SUMMARY,
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: QUERY_NAME.DAILY_CATEGORY,
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: QUERY_NAME.SUMMARY_SESSION,
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: QUERY_NAME.MANUAL_ANALYZE,
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: QUERY_NAME.MANUAL_SLOT_STATUS,
    adapter: BullMQAdapter,
  }),
  BullBoardModule.forFeature({
    name: QUERY_NAME.NORMAL_ANALYZE,
    adapter: BullMQAdapter,
  }),
];
