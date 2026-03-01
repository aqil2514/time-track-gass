import { Module } from '@nestjs/common';
import { ImageUploadController } from './controller/image-upload.controller';
import { ImageScannerService } from './services/image-scanner.service';

@Module({
  controllers: [ImageUploadController],
  providers: [ImageScannerService],
})
export class ImageUploadModule {}
