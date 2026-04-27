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
  private readonly logger = new Logger(ImageUploadController.name);
  constructor(
    private readonly scannerService: ImageScannerService,
    private readonly validationService: ImageValidationService,
  ) {}

  @UseGuards(UserThrottlerGuard)
  @Post('')
  async uploadFile(@Body() body: ImageUploadDto, @UserId() userId: string) {
    await this.scannerService.analyzeActivity(body.image, userId);
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
    this.logger.log(
      `Memulai proses upload manual untuk User: ${userId} pada tanggal: ${date}`,
    );

    // 1. Validasi keberadaan file
    if (!images || images.length === 0) {
      this.logger.warn(`User ${userId} mencoba upload tanpa file`);
      throw new BadRequestException('Tidak ada gambar yang diunggah');
    }

    try {
      // 2. Proses validasi gambar
      const { invalidImages, validImages } =
        await this.validationService.validateImage(images, body, date);

      if (invalidImages.length !== 0) {
        this.logger.warn(
          `${invalidImages.length} gambar gagal divalidasi untuk User ${userId}`,
        );

        throw new UnprocessableEntityException({
          message: 'Beberapa gambar tidak valid',
          invalidImages: invalidImages.map((img) => ({
            // Gunakan optional chaining untuk menghindari 'cannot read property of undefined'
            filename: img.file?.originalname || 'Unknown',
            reason: img.invalidResult,
          })),
        });
      }

      // 3. Proses analisis aktivitas
      this.logger.log(`Menganalisis ${validImages.length} gambar valid...`);

      await this.scannerService.analyzeActivityManual(
        validImages,
        userId,
        body.slotId, // Pastikan DTO sudah mentransform string ke number jika perlu
        date,
      );

      this.logger.log(`Analisis selesai untuk User ${userId}`);
      return { success: true };
    } catch (error) {
      // 4. Logging error tak terduga
      this.logger.error(
        `Gagal memproses upload: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error; // Teruskan error agar ditangani Exception Filter
    }
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
