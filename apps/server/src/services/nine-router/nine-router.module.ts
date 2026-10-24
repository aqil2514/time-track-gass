import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NineRouterService } from './nine-router.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [NineRouterService],
  exports: [NineRouterService],
})
export class NineRouterModule {}
