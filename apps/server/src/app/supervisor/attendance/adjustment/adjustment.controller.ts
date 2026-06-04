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
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import {
  CreateAttendanceAdjustmentDto,
  UpdateAttendanceAdjustmentDto,
} from '../../dto/attendance/adjustment.dto';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';
import { AdjustmentService } from './adjustment.service';
import 'multer';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/adjustment')
export class AdjustmentController {
  constructor(private readonly service: AdjustmentService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: CreateAttendanceAdjustmentDto,
  ) {
    return this.service.create(body, files);
  }

  @Get()
  async getByDateRange(@Query() query: AttendanceLogsQueryDto) {
    return this.service.getByDateRange(query.start, query.end);
  }

  @Get(':adjustmentId')
  async getById(@Param('adjustmentId') adjustmentId: string) {
    return this.service.getById(adjustmentId);
  }

  @Delete(':adjustmentId')
  async delete(@Param('adjustmentId') adjustmentId: string) {
    return this.service.delete(adjustmentId);
  }

  @Patch(':adjustmentId')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('adjustmentId') adjustmentId: string,
    @Body() body: UpdateAttendanceAdjustmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.service.update(adjustmentId, body, image);
  }
}
