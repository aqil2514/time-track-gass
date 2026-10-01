import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyzerService } from './services/analyzer.service';
import { NineRouterService } from './services/nine-router/nine-router.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AnalyzerService, NineRouterService],
  exports: [AnalyzerService, NineRouterService],
})
export class AnalyzerModule {}
