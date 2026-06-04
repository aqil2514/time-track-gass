import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { CreateListNoteDto } from '../../dto/attendance/create-list-note.dto';
import { ListNoteService } from './list-note.service';

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/list-note')
export class ListNoteController {
  constructor(private readonly service: ListNoteService) {}

  @Post()
  async create(@Body() body: CreateListNoteDto) {
    return this.service.create(body);
  }

  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Patch(':listId')
  async update(@Param('listId') listId: string, @Body() body: CreateListNoteDto) {
    return this.service.update(listId, body);
  }

  @Delete(':listId')
  async delete(@Param('listId') listId: string) {
    return this.service.delete(listId);
  }
}
