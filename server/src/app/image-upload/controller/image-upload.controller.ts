import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageScannerService } from '../services/image-scanner.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('image-upload')
export class ImageUploadController {
  constructor(private readonly scannerService: ImageScannerService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const user = req.user;
    const userId = user.user.id;

    return await this.scannerService.analizeActivity(file, userId);
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
