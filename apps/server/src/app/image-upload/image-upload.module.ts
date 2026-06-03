import { Module } from '@nestjs/common';
import { ImageUploadController } from './controller/image-upload.controller';
import { ImageScannerService } from './services/image-scanner.service';
import { ImageValidationService } from './services/image-validation.service';
import { BullModule } from '@nestjs/bullmq';
import { FLOW_NAME, QUERY_NAME } from 'src/constants/queue.constant';
import { ManualAnalyzeProcessor } from './processor/manual-analyze.processor';
import { ManualStatusProcessor } from './processor/manual-status.processor';
import { NormalAnalyzeProcessor } from './processor/normal-analyze.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUERY_NAME.MANUAL_ANALYZE,
      },
      {
        name: QUERY_NAME.MANUAL_SLOT_STATUS,
      },
      {
        name: QUERY_NAME.NORMAL_ANALYZE,
      },
    ),
    BullModule.registerFlowProducer({
      name: FLOW_NAME.MANUAL_ANALYZE_FLOW,
    }),
  ],
  controllers: [ImageUploadController],
  providers: [
    ImageScannerService,
    ImageValidationService,

    ManualAnalyzeProcessor,
    ManualStatusProcessor,
    NormalAnalyzeProcessor,
  ],
})
export class ImageUploadModule {}
