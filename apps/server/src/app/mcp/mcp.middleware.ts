import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const RESOURCE_URL = 'https://aedlitian-franchesca-gingely.ngrok-free.dev';

@Injectable()
export class McpAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return next();
    }

    res.setHeader(
      'WWW-Authenticate',
      `Bearer resource_metadata="${RESOURCE_URL}/.well-known/oauth-protected-resource"`,
    );
    return res.status(401).json({ error: 'unauthorized' });
  }
}
