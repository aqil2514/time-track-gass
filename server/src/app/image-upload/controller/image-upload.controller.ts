import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageScannerService } from '../services/image-scanner.service';

@Controller('image-upload')
export class ImageUploadController {
  constructor(private readonly scannerService: ImageScannerService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.scannerService.analizeActivity(file);
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
