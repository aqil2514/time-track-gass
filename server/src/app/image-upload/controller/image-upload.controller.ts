import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ImageScannerService } from '../services/image-scanner.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ImageUploadDto } from '../dto/image-upload.dto';

@UseGuards(JwtAuthGuard)
@Controller('image-upload')
export class ImageUploadController {
  constructor(private readonly scannerService: ImageScannerService) {}

  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @Req() req: any) {
    const user = req.user;
    const userId = user.user.id;

    return await this.scannerService.analyzeActivity(body.image, userId);
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
