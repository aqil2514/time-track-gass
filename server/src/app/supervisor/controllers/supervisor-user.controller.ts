import { Controller, Get, Post, Patch, Param, Body, Delete } from '@nestjs/common';
import { SupervisorUserService } from '../services/supervisor-user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';

@Controller('supervisor/user')
export class SupervisorUserController {
  constructor(private readonly supervisorUserService: SupervisorUserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.createUserData(createUserDto);
  }

  @Get()
  async findAll(): Promise<ProfilesWithNoPassword[]> {
    return this.supervisorUserService.getAllUserData();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.getUserById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    return this.supervisorUserService.updateUserData(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.supervisorUserService.deleteUserData(id);
  }
}