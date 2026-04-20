import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ImageScannerService } from '../services/image-scanner.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ImageUploadDto } from '../dto/image-upload.dto';
import { UserThrottlerGuard } from 'src/guards/throttler.guard';
import { UserId } from 'src/decorators/user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('image-upload')
export class ImageUploadController {
  constructor(private readonly scannerService: ImageScannerService) {}

  // TODO: NANTI INI MASUK KE BULLMQ AJAH, TERUS DIBUAT AGAR 4 MENIT AJAH BATASNYA. MENGHINDARI PUTUS KONEKSI
  @UseGuards(UserThrottlerGuard)
  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @UserId() userId: string) {
    return await this.scannerService.analyzeActivity(body.image, userId);
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
