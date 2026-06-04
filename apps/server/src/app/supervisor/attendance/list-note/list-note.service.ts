import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateListNoteDto } from '../../dto/attendance/create-list-note.dto';
import { getAllListNotes } from 'src/helpers/supervisor/attendance/list-note/getAllListNotes.helper';
import { createListNote } from 'src/helpers/supervisor/attendance/list-note/createListNote.helper';
import { updateListNote } from 'src/helpers/supervisor/attendance/list-note/updateListNote.helper';
import { deleteListNote } from 'src/helpers/supervisor/attendance/list-note/deleteListNote.helper';

@Injectable()
export class ListNoteService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    // Step 1: Ambil semua list note dari DB
    return getAllListNotes(this.prisma);
  }

  async create(body: CreateListNoteDto) {
    // Step 1: Simpan list note baru ke DB
    return createListNote(this.prisma, body);
  }

  async update(listId: string, body: CreateListNoteDto) {
    // Step 1: Update list note di DB
    return updateListNote(this.prisma, listId, body);
  }

  async delete(listId: string) {
    // Step 1: Soft delete list note di DB
    return deleteListNote(this.prisma, listId);
  }
}
