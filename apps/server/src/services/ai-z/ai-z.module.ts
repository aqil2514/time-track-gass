import { Global, Module } from '@nestjs/common';
import { ZAIService } from './ai-z.service';
import { AnalyzeImageService } from './helper/analyze-image.service';
import { ZAIHelperService } from './helper/general.service';

@Global()
@Module({
  providers: [ZAIService, AnalyzeImageService, ZAIHelperService],
  exports: [ZAIService],
})
export class ZAIModule {}
