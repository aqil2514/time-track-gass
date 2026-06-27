import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { UserId } from 'src/decorators/user-id.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadImageManualDto } from '../dto/image-upload-manual.dto';
import { ImageUploadManualService } from '../services/image-upload-manual.service';

@UseGuards(JwtAuthGuard)
@Controller('image-upload/manual')
export class ImageUploadManualController {
  private readonly logger = new Logger(ImageUploadManualController.name);

  constructor(private readonly manualService: ImageUploadManualService) {}

  @Post('')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFileManual(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() body: UploadImageManualDto,
    @Query('date') date: string,
    @UserId() userId: string,
  ) {
    this.logger.log(`POST /image-upload/manual - user=${userId} slot=${body.slotId} date=${date} files=${images?.length ?? 0}`);
    await this.manualService.upload(images, userId, body.slotId, date);
    return { success: true };
  }

  @Get('')
  async getIsExistFile(
    @Query('slotId') slotId: number,
    @Query('date') date: string,
    @UserId() userId: string,
  ) {
    const result = await this.manualService.getStatus(userId, slotId, date);
    this.logger.log(`GET /image-upload/manual - user=${userId} slot=${slotId} date=${date} -> status=${result.status}`);
    return result;
  }

  @Delete('invalid')
  async clearInvalid(
    @Query('slotId') slotId: number,
    @Query('date') date: string,
    @UserId() userId: string,
  ) {
    this.logger.log(`DELETE /image-upload/manual/invalid - user=${userId} slot=${slotId} date=${date}`);
    await this.manualService.clearInvalid(userId, slotId, date);
    return { success: true };
  }
}
