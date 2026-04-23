import { Module } from '@nestjs/common';
import { ImageUploadController } from './controller/image-upload.controller';
import { ImageScannerService } from './services/image-scanner.service';
import { ImageScannerHelper } from './services/helpers/image-scanner-helper.service';
import { AnalyzerAgentHelperService } from './services/helpers/analyzer-agent-helper.service';
import { BuildPromptHelperService } from './services/helpers/build-prompt-helper.service';
import { ZhipuAnalyzeMapper } from './services/ai-mapper/zhipu-analyze.mapper';
import { GeminiAnalyzeMapper } from './services/ai-mapper/gemini-analyze.mapper';
import { ImageValidationService } from './services/image-validation.service';
import { BullModule } from '@nestjs/bullmq';
import { FLOW_NAME, QUERY_NAME } from 'src/constants/queue.constant';
import { ManualAnalyzeProcessor } from './processor/manual-analyze.processor';
import { ManualStatusProcessor } from './processor/manual-status.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUERY_NAME.MANUAL_ANALYZE,
      },
      {
        name: QUERY_NAME.MANUAL_SLOT_STATUS,
      },
    ),
    BullModule.registerFlowProducer({
      name: FLOW_NAME.MANUAL_ANALYZE_FLOW,
    }),
  ],
  controllers: [ImageUploadController],
  providers: [
    ImageScannerService,
    ImageScannerHelper,
    ImageValidationService,
    AnalyzerAgentHelperService,
    BuildPromptHelperService,

    ManualAnalyzeProcessor,
    ManualStatusProcessor,

    ZhipuAnalyzeMapper,
    GeminiAnalyzeMapper,
  ],
})
export class ImageUploadModule {}
