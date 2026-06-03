import { Global, Module } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

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
    SupabaseService
  ],
  exports: ['SUPABASE_CLIENT', SupabaseService],
})
export class SupabaseModule {}
