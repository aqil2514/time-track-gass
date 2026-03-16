import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProfilesWithNoPassword } from 'src/app/auth/interfaces/profiles.interface';
import { TableName } from 'src/services/supabase/supabase.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class SupervisorUserService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllUserData(): Promise<ProfilesWithNoPassword[]> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id, email, username, full_name, role, division')
      .is('deleted_at', null)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }

    return data as ProfilesWithNoPassword[];
  }

  async getUserById(id: string): Promise<ProfilesWithNoPassword> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .select('id, email, username, full_name, role, division')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }

    if (!data) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return data as ProfilesWithNoPassword;
  }

  async updateUserData(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .update({
        full_name: updateUserDto.fullName,
        email: updateUserDto.email,
        role: updateUserDto.role,
        division: updateUserDto.division,
      })
      .eq('id', id)
      .select('id, email, username, full_name, role, division')
      .single();

    if (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }

    return data as ProfilesWithNoPassword;
  }

  async createUserData(
    createUserDto: CreateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    const { data, error } = await this.supabase
      .from(TableName.Profiles)
      .insert([
        {
          full_name: createUserDto.fullName,
          username: createUserDto.username,
          email: createUserDto.email,
          password: createUserDto.password,
          role: createUserDto.role,
          division: createUserDto.division,
        },
      ])
      .select('id, email, username, full_name, role, division')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data as ProfilesWithNoPassword;
  }

  async deleteUserData(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(TableName.Profiles)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}
