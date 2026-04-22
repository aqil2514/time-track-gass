import {
  Body,
  Controller,
  Get,
  Post,
  UnprocessableEntityException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageScannerService } from '../services/image-scanner.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ImageUploadDto } from '../dto/image-upload.dto';
import { UserThrottlerGuard } from 'src/guards/throttler.guard';
import { UserId } from 'src/decorators/user-id.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadImageManualDto } from '../dto/image-upload-manual.dto';
import { ImageValidationService } from '../services/image-validation.service';

@UseGuards(JwtAuthGuard)
@Controller('image-upload')
export class ImageUploadController {
  constructor(
    private readonly scannerService: ImageScannerService,
    private readonly validationService: ImageValidationService,
  ) {}

  // TODO: NANTI INI MASUK KE BULLMQ AJAH, TERUS DIBUAT AGAR 4 MENIT AJAH BATASNYA. MENGHINDARI PUTUS KONEKSI
  @UseGuards(UserThrottlerGuard)
  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @UserId() userId: string) {
    return await this.scannerService.analyzeActivity(body.image, userId);
  }

  @Post('manual')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFileManual(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() body: UploadImageManualDto,
    @UserId() userId: string,
  ) {
    const { invalidImages, validImages } =
      await this.validationService.validateImage(images, body, userId);

    // if (invalidImages.length !== 0) {
    //   throw new UnprocessableEntityException({
    //     message: 'Beberapa gambar tidak valid',
    //     invalidImages: invalidImages.map((img) => ({
    //       filename: img.file.originalname,
    //       reason: img.invalidResult,
    //     })),
    //   });
    // }

    await this.scannerService.analyzeActivityManual(validImages, userId)

    return { success: true };
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
