import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateListNoteDto } from '../../dto/attendance/create-list-note.dto';
import { AttendanceListnoteService } from '../../services/attendance/attendance-listnote.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/list-note')
export class SupervisorAttendanceListNoteController {
  constructor(private readonly service: AttendanceListnoteService) {}
  @Post()
  async createNewListNote(@Body() body: CreateListNoteDto) {
    return await this.service.createNewAttendance(body);
  }

  @Get()
  async getListNote() {
    return await this.service.getAttendanceListNotes();
  }
}
