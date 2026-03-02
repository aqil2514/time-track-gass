import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from './supabase.interface';

@Injectable()
export class SupabaseService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async createNewData(tableName: TableName, data: any) {
    const { error } = await this.supabase.from(tableName).insert(data);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async getDataByColumn<T = unknown>(
    tableName: TableName,
    column: string,
    value: string,
    select = '*',
  ): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(tableName)
      .select(select)
      .eq(column, value);

    if (error) {
      console.error(error);
      throw new InternalServerErrorException('Database query failed');
    }

    return (data ?? []) as T[];
  }

  async isExistValue(
    tableName: TableName,
    column: string,
    value: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(tableName)
      .select('id')
      .eq(column, value)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}
