import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import {
  CreateAttendanceAdjustmentDto,
  UpdateAttendanceAdjustmentDto,
} from '../../dto/attendance/adjustment.dto';
import { AttendanceAdjustmentService } from '../../services/attendance/attendance-adjustment.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import 'multer';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/adjustment')
export class AttendanceAdjustmentController {
  constructor(private readonly service: AttendanceAdjustmentService) {}

  @Post('')
  @UseInterceptors(AnyFilesInterceptor())
  async createNewAdjustment(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: CreateAttendanceAdjustmentDto,
  ) {
    return await this.service.createNewAdjusment(body, files);
  }

  @Get('')
  async getAdjustmentContent(@Query() query: AttendanceLogsQueryDto) {
    return await this.service.getAdjustmentContentByDateRange(
      query.start,
      query.end,
    );
  }

  @Delete(':adjustmentId')
  async deleteAdjustment(@Param('adjustmentId') adjustmentId: string) {
    return await this.service.deleteAdjustmentById(adjustmentId);
  }

  @Patch(':adjustmentId')
  @UseInterceptors(FileInterceptor('image'))
  async editAdjustment(
    @Param('adjustmentId') adjustmentId: string,
    @Body() body: UpdateAttendanceAdjustmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return await this.service.updateAttendanceAdjustment(adjustmentId, body, image);
  }

  @Get(':adjustmentId')
  async getAdjustmentContentById(@Param('adjustmentId') adjustmentId: string) {
    return await this.service.getAttendanceById(adjustmentId);
  }
}
