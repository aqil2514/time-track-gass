import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BULL_QUEUE_REGISTRY } from './app-registry/bull-registry';
import { THROTTLER_REGISTRY } from './app-registry/throttler-registry';
import { BUILT_IN_REGISTRY } from './app-registry/built-in-registry';
import { THIRD_PARTY_REGISTRY } from './app-registry/third-party-registry';
import { CONFIG_REGISTRY } from './app-registry/config-registry';

@Module({
  imports: [
    ...CONFIG_REGISTRY,

    ...BULL_QUEUE_REGISTRY,
    ...THROTTLER_REGISTRY,

    ...THIRD_PARTY_REGISTRY,
    ...BUILT_IN_REGISTRY,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
