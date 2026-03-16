import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  private async checkUniqueness(
    email: string,
    username: string,
    excludeId?: string,
  ) {
    let query = this.supabase
      .from(TableName.Profiles)
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      const conflict = data[0];
      if (conflict.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (conflict.username === username) {
        throw new ConflictException('Username already exists');
      }
    }
  }

  async createUserData(
    createUserDto: CreateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    await this.checkUniqueness(createUserDto.email, createUserDto.username);

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
      // 2. Backup check jika constraint DB yang kena
      if (error.code === '23505')
        throw new ConflictException('User already exists');
      throw error;
    }

    return data as ProfilesWithNoPassword;
  }

  async updateUserData(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ProfilesWithNoPassword> {
    const { data: currentUser } = await this.supabase
      .from(TableName.Profiles)
      .select('username')
      .eq('id', id)
      .single();

    await this.checkUniqueness(
      updateUserDto.email,
      currentUser?.username || '',
      id,
    );

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
      if (error.code === '23505')
        throw new ConflictException('Email already used by another user');
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

  async deleteUserPassword(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(TableName.Profiles)
      .update({ password: ""})
      .eq('id', id);

    if (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}
