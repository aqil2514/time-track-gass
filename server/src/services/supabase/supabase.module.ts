import { Global, Module } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Global()
@Module({
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: () =>
        new SupabaseClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SECRET_KEY,
        ),
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
