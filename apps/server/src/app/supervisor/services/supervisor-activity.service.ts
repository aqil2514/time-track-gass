import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { TableName } from 'src/services/supabase/supabase.interface';

@Injectable()
export class SupervisorACtivityService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async softDeleteActivity(activityIds: string[]) {
    const { error } = await this.supabase
      .from(TableName.AIScreenReport)
      .update({ deleted_at: new Date().toISOString() })
      .in('id', activityIds);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async bulkEditCategory(activityIds: string[], newCategory: string) {
    const { error } = await this.supabase
      .from(TableName.AIScreenReport)
      .update({ category: newCategory })
      .in('id', activityIds);

    if (error) {
      console.error(error);
      throw error;
    }
  }
}
