import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateAttendanceAdjustmentDto, UpdateAttendanceAdjustmentDto } from '../../dto/attendance/adjustment.dto';
import { AttendanceAdjustmentService } from '../../services/attendance/attendance-adjustment.service';
import { AttendanceLogsQueryDto } from '../../dto/attendance/attendance-logs-query.dto';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/adjustment')
export class AttendanceAdjustmentController {
  constructor(private readonly service: AttendanceAdjustmentService) {}

  @Post('')
  async createNewAdjustment(@Body() body: CreateAttendanceAdjustmentDto) {
    return await this.service.createNewAdjusment(body);
  }

  @Get('')
  async getAdjustmentContent(@Query() query: AttendanceLogsQueryDto) {
    return await this.service.getAdjustmentContentByDateRange(
      query.start,
      query.end,
    );
  }

  @Delete(':adjustmentId')
  async deleteAdjustment(@Param("adjustmentId") adjustmentId:string){
    return await this.service.deleteAdjustmentById(adjustmentId)
  }

  @Patch(":adjustmentId")
  async editAdjustment(@Param("adjustmentId") adjustmentId:string, @Body() body:UpdateAttendanceAdjustmentDto){
    return await this.service.updateAttendanceAdjustment(adjustmentId, body)
  }
}
