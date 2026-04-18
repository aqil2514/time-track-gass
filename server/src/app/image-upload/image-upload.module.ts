import { Module } from '@nestjs/common';
import { ImageUploadController } from './controller/image-upload.controller';
import { ImageScannerService } from './services/image-scanner.service';
import { ImageScannerHelper } from './services/helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from './services/helpers/analyzer-agent-helper.service';
import { BuildPromptHelperService } from './services/helpers/build-prompt-helper.service';

@Module({
  controllers: [ImageUploadController],
  providers: [
    ImageScannerService,
    ImageScannerHelper,
    AnalyzerAgentHelperService,
    BuildPromptHelperService,
  ],
})
export class ImageUploadModule {}
