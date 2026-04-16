import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

export const THROTTLER_REGISTRY = [
  ThrottlerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      throttlers: [
        {
          name: 'short',
          limit: 1,
          ttl: 300000,
          // blockDuration: 300000,
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
];
