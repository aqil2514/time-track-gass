import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.BULL_MQ_REDIS_HOST,
          port: parseInt(process.env.BULL_MQ_REDIS_PORT),
          password: process.env.BULL_MQ_REDIS_PASSWORD,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        }),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
