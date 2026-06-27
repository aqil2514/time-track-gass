import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ImageScannerService } from '../services/image-scanner.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ImageUploadDto } from '../dto/image-upload.dto';
import { UserId } from 'src/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('image-upload')
export class ImageUploadController {
  constructor(
    private readonly scannerService: ImageScannerService,
  ) {}

  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @UserId() userId: string) {
    await this.scannerService.addToNormalQueue(body.image, userId);
    return { success: true };
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
