import { AIGeminiModule } from 'src/services/ai-gemini/ai-gemini.module';
import { AnalyzerModule } from 'src/services/analyzer/analyzer.module';
import { AWSS3Module } from 'src/services/aws-s3/aws-s3.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { RedisModule } from 'src/services/redis/redis.module';

export const THIRD_PARTY_REGISTRY = [
  AIGeminiModule,
  AWSS3Module,
  PrismaModule,
  AnalyzerModule,
  RedisModule,
];
