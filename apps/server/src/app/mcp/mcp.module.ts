import { McpModule } from '@nestjs-mcp/server';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthCoreModule } from '../auth/core/auth-core.module';
import { McpGuard } from './mcp.guard';
import { McpAuthMiddleware } from './mcp.middleware';
import { McpOAuthController } from './mcp.oauth.controller';
import { TimetrackMCPResolver } from './mcp.resolver';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'Timetrack MCP Server',
      version: '0.0.1',
      logging: { enabled: true },
    }),
    AuthCoreModule,
  ],
  controllers: [McpOAuthController],
  providers: [TimetrackMCPResolver, McpGuard],
})
export class TimeTrackMcpModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(McpAuthMiddleware)
      .forRoutes({ path: 'mcp', method: RequestMethod.ALL });
  }
}
