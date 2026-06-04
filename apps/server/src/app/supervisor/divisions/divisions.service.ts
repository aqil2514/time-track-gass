import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateDivisionDto } from '../dto/create-division.dto';
import { getAllDivisions } from 'src/helpers/supervisor/divisions/getAllDivisions.helper';
import { createDivision } from 'src/helpers/supervisor/divisions/createDivision.helper';
import { editDivision } from 'src/helpers/supervisor/divisions/editDivision.helper';
import { deleteDivision } from 'src/helpers/supervisor/divisions/deleteDivision.helper';

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllDivision() {
    // Step 1: Ambil semua data divisi dari DB
    return getAllDivisions(this.prisma);
  }

  async createNewDivision(payload: CreateDivisionDto) {
    // Step 1: Simpan divisi baru ke DB
    return createDivision(this.prisma, payload);
  }

  async editDivision(payload: CreateDivisionDto, id: string) {
    // Step 1: Update data divisi di DB
    return editDivision(this.prisma, payload, id);
  }

  async deleteDivision(id: string) {
    // Step 1: Soft delete divisi di DB
    return deleteDivision(this.prisma, id);
  }
}
