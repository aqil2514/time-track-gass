import { AIGeminiModule } from 'src/services/ai-gemini/ai-gemini.module';
import { ZAIModule } from 'src/services/ai-z/ai-z.module';
import { AnalyzerModule } from 'src/services/analyzer/analyzer.module';
import { AWSS3Module } from 'src/services/aws-s3/aws-s3.module';
import { SupabaseModule } from 'src/services/supabase/supabase.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';

export const THIRD_PARTY_REGISTRY = [
  AIGeminiModule,
  ZAIModule,
  SupabaseModule,
  AWSS3Module,
  PrismaModule,

  AnalyzerModule
];
