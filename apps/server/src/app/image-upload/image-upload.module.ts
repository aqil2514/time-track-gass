import { Module } from '@nestjs/common';
import { ImageUploadController } from './controller/image-upload.controller';
import { ImageUploadManualController } from './controller/image-upload-manual.controller';
import { ImageScannerService } from './services/image-scanner.service';
import { ImageValidationService } from './services/image-validation.service';
import { ImageUploadManualService } from './services/image-upload-manual.service';
import { BullModule } from '@nestjs/bullmq';
import { QUERY_NAME } from 'src/constants/queue.constant';
import { ManualAnalyzeProcessor } from './processor/manual-analyze.processor';
import { NormalAnalyzeProcessor } from './processor/normal-analyze.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUERY_NAME.MANUAL_ANALYZE },
      { name: QUERY_NAME.NORMAL_ANALYZE },
    ),
  ],
  controllers: [ImageUploadController, ImageUploadManualController],
  providers: [
    ImageScannerService,
    ImageValidationService,
    ImageUploadManualService,
    ManualAnalyzeProcessor,
    NormalAnalyzeProcessor,
  ],
})
export class ImageUploadModule {}
