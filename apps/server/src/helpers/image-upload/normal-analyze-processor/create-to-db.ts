import { SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { ZImageAnalyzeData } from 'src/services/ai-z/interface/ai-z.interface';
import { TableName } from 'src/services/supabase/supabase.interface';

export async function createNewAnalyzeData(
  supabase: SupabaseClient,
  data: ZImageAnalyzeData,
) {
  const { error } = await supabase.from(TableName.AIScreenReport).insert(data);

  if (error) {
    console.error(error);
    throw error;
  }
}
