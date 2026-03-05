import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AIGeminiModule } from '../services/ai-gemini/ai-gemini.module';
import { CloudinaryModule } from '../services/cloudinary/cloudinary.module';
import { ZAIModule } from '../services/ai-z/ai-z.module';
import { SupabaseModule } from '../services/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SupervisorModule } from './supervisor/supervisor.module';

@Module({
  imports: [
    ImageUploadModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    AIGeminiModule,
    CloudinaryModule,
    ZAIModule,
    SupabaseModule,
    AuthModule,
    ActivitiesModule,
    SupervisorModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
