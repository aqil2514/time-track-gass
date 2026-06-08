import { Injectable } from '@nestjs/common';
import { McpExecutionContext, SessionManager } from '@nestjs-mcp/server';
import { Request, Response } from 'express';

const RESOURCE_URL = 'https://aedlitian-franchesca-gingely.ngrok-free.dev';

@Injectable()
export class McpGuard {
  constructor(private readonly sessionManager: SessionManager) {}

  canActivate(context: McpExecutionContext): boolean {
    const sessionId = context.getSessionId();
    const session = this.sessionManager.getSession(sessionId);
    console.log('[McpGuard] sessionId:', sessionId, '| session found:', !!session);
    if (!session) return false;

    const request = session.request as Request & { res?: Response };
    const authHeader = request.headers.authorization;
    console.log('[McpGuard] Authorization header:', authHeader ?? '(none)');

    if (authHeader?.startsWith('Bearer ')) {
      return true;
    }

    const response = request.res;
    console.log('[McpGuard] response object exists:', !!response, '| headersSent:', response?.headersSent);
    if (response && !response.headersSent) {
      response.setHeader(
        'WWW-Authenticate',
        `Bearer resource_metadata="${RESOURCE_URL}/.well-known/oauth-protected-resource"`,
      );
      response.status(401).json({ error: 'unauthorized' });
      console.log('[McpGuard] Sent 401 with WWW-Authenticate');
    }

    return false;
  }
}
