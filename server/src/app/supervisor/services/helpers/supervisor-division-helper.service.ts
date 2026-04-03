import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';
import { DivisionsDb } from '../../interfaces/divisions.interface';
import { CreateDivisionDto } from '../../dto/create-division.dto';

@Injectable()
export class SupervisorDivisionHelperService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async getAllDivisions(): Promise<DivisionsDb[]> {
    const { data, error } = await this.supabase
      .from(TableName.Divisions)
      .select('*')
      .order("name");

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  async createNewDivision(payload: CreateDivisionDto) {
    const { error } = await this.supabase
      .from(TableName.Divisions)
      .insert(payload);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async editDivisionById(payload:CreateDivisionDto, oldId:string){
    const {error} = await this.supabase.from(TableName.Divisions).update(payload).eq("id", oldId);

    if(error){
      console.log(error);
      throw error
    }
  }
}
