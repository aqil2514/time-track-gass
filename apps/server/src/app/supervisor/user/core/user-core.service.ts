import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateUserDto } from '../../_dto/create-user.dto';
import { UpdateUserDto } from '../../_dto/update-user.dto';
import { getAllUsers } from 'src/helpers/supervisor/user/getAllUsers.helper';
import { getUserById } from 'src/helpers/supervisor/user/getUserById.helper';
import { checkUserUniqueness } from 'src/helpers/supervisor/user/checkUserUniqueness.helper';
import { getDivisionName } from 'src/helpers/supervisor/user/getDivisionName.helper';
import { createUser } from 'src/helpers/supervisor/user/createUser.helper';
import { updateUser } from 'src/helpers/supervisor/user/updateUser.helper';
import { deleteUser } from 'src/helpers/supervisor/user/deleteUser.helper';
import { markMustResetPassword } from 'src/helpers/supervisor/user/markMustResetPassword.helper';

@Injectable()
export class UserCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllUsers() {
    // Step 1: Ambil semua user dari DB
    return getAllUsers(this.prisma);
  }

  async getUserById(id: string) {
    // Step 1: Ambil user by ID dari DB
    return getUserById(this.prisma, id);
  }

  async createUser(dto: CreateUserDto) {
    // Step 1: Cek uniqueness email dan username
    await checkUserUniqueness(this.prisma, dto.email, dto.username);
    // Step 2: Ambil nama divisi
    const divisionName = await getDivisionName(this.prisma, dto.division);
    // Step 3: Simpan user baru ke DB dan emit event
    return createUser(this.prisma, this.eventEmitter, dto, divisionName);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    // Step 1: Ambil username saat ini untuk cek uniqueness
    const current = await getUserById(this.prisma, id);
    // Step 2: Cek uniqueness email (username tidak bisa diubah)
    await checkUserUniqueness(this.prisma, dto.email, current.username, id);
    // Step 3: Ambil nama divisi
    const divisionName = await getDivisionName(this.prisma, dto.division);
    // Step 4: Update data user di DB
    return updateUser(this.prisma, id, dto, divisionName);
  }

  async deleteUser(id: string) {
    // Step 1: Soft delete user di DB dan emit event
    return deleteUser(this.prisma, this.eventEmitter, id);
  }

  async markMustResetPassword(id: string) {
    // Step 1: Set flag must_reset_password di DB
    return markMustResetPassword(this.prisma, id);
  }
}
