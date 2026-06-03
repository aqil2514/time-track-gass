import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';
import { ImageUploadModule } from '../image-upload/image-upload.module';
import { LogModule } from '../log/log.module';
import { SupervisorModule } from '../supervisor/supervisor.module';
import { TestModule } from '../test/test.module';
import { WorkSessionModule } from '../work-session/work-session.module';

export const BUILT_IN_REGISTRY = [
  TestModule,
  AuthModule,
  ActivitiesModule,
  SupervisorModule,
  ImageUploadModule,
  LogModule,
  WorkSessionModule
];
