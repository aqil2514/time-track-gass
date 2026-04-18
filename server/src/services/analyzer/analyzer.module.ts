import { Global, Module } from '@nestjs/common';
import { AnalyzerService } from './services/analyzer.service';
import { ZhipuAiService } from './services/zhipu-ai/zhipu-ai.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AnalyzerService, ZhipuAiService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
