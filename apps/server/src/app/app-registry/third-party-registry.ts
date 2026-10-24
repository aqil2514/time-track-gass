import { NineRouterModule } from 'src/services/nine-router/nine-router.module';
import { AWSS3Module } from 'src/services/aws-s3/aws-s3.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { RedisModule } from 'src/services/redis/redis.module';

export const THIRD_PARTY_REGISTRY = [
  AWSS3Module,
  PrismaModule,
  NineRouterModule,
  RedisModule,
];
