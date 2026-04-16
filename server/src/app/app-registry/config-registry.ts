import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

export const CONFIG_REGISTRY = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  ScheduleModule.forRoot(),
  EventEmitterModule.forRoot(),
];
