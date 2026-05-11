import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
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

  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @UserId() userId: string) {
    await this.scannerService.addToNormalQueue(body.image, userId);
    return { success: true };
  }

  @Post('manual')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFileManual(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() body: UploadImageManualDto,
    @Query('date') date: string,
    @UserId() userId: string,
  ) {
    const { invalidImages, validImages } =
      await this.validationService.validateImage(images, body, date);

    if (invalidImages.length !== 0) {
      throw new UnprocessableEntityException({
        message: 'Beberapa gambar tidak valid',
        invalidImages: invalidImages.map((img) => ({
          filename: img.file?.originalname || 'Unknown',
          reason: img.invalidResult,
        })),
      });
    }

    await this.scannerService.analyzeActivityManual(
      validImages,
      userId,
      body.slotId,
      date,
    );

    return { success: true };
  }

  @Get('manual')
  async getIsExistFile(
    @Query('slotId') slotId: number,
    @Query('date') date: string,
    @UserId() userId: string,
  ) {
    const isHaveInDb = await this.scannerService.isHaveInDb(
      slotId,
      userId,
      date,
    );

    if (isHaveInDb) return { status: 'verified' };

    const isHaveInBullMq = await this.scannerService.isHaveInBullMq(
      slotId,
      userId,
      date,
    );

    if (isHaveInBullMq) return { status: 'progress' };

    return { status: 'not-found' };
  }

  @Get('')
  async getData() {
    return await this.scannerService.getActivities();
  }
}
