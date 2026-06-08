import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthCoreService } from '../auth/core/auth-core.service';

const RESOURCE_URL = 'https://aedlitian-franchesca-gingely.ngrok-free.dev';
const STATIC_CLIENT_ID = 'timetrack-mcp-client';
const STATIC_CLIENT_SECRET = 'timetrack-mcp-secret';

// In-memory store: code -> { userId, redirectUri, expiresAt }
const authCodes = new Map<string, { userId: string; username: string; role: string; email: string; settings: unknown; redirectUri: string; expiresAt: number }>();

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

@Controller()
export class McpOAuthController {
  constructor(
    private readonly authService: AuthCoreService,
    private readonly jwt: JwtService,
  ) {}

  @Get('.well-known/oauth-protected-resource')
  protectedResource() {
    return {
      resource: RESOURCE_URL,
      authorization_servers: [RESOURCE_URL],
      bearer_methods_supported: ['header'],
      scopes_supported: ['mcp:read'],
      resource_name: 'Timetrack MCP Server',
    };
  }

  @Get('.well-known/oauth-authorization-server')
  authorizationServer() {
    return {
      issuer: RESOURCE_URL,
      authorization_endpoint: `${RESOURCE_URL}/oauth/authorize`,
      token_endpoint: `${RESOURCE_URL}/oauth/token`,
      registration_endpoint: `${RESOURCE_URL}/oauth/register`,
      code_challenge_methods_supported: ['S256'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      scopes_supported: ['mcp:read'],
    };
  }

  @Post('oauth/register')
  registerClient(@Body() body: Record<string, unknown>) {
    console.log('[OAuth] /oauth/register body:', JSON.stringify(body, null, 2));
    const response = {
      client_id: STATIC_CLIENT_ID,
      client_secret: STATIC_CLIENT_SECRET,
      redirect_uris: body.redirect_uris ?? [],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    };
    console.log('[OAuth] registration response:', JSON.stringify(response, null, 2));
    return response;
  }

  @Get('oauth/authorize')
  showLoginForm(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('client_id') clientId: string,
    @Res() res: Response,
  ) {
    console.log('[OAuth] GET /oauth/authorize | client_id:', clientId, '| redirect_uri:', redirectUri, '| state:', state);
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Timetrack</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 380px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    p { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
    input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem; }
    button { width: 100%; padding: 0.625rem; background: #000; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
    button:hover { background: #333; }
    .error { color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Timetrack</h1>
    <p>Login untuk menghubungkan ke Claude</p>
    <div class="error" id="error"></div>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="${redirectUri}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge}" />
      <input type="hidden" name="client_id" value="${clientId}" />
      <label>Username atau Email</label>
      <input type="text" name="identifier" required autocomplete="username" />
      <label>Password</label>
      <input type="password" name="password" required autocomplete="current-password" />
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('oauth/authorize')
  async handleLogin(
    @Body() body: { identifier: string; password: string; redirect_uri: string; state: string; client_id: string },
    @Res() res: Response,
  ) {
    try {
      const user = await this.authService.login({
        identifier: body.identifier,
        password: body.password,
      });

      const code = generateCode();
      authCodes.set(code, {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        settings: user.settings,
        redirectUri: body.redirect_uri,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 menit
      });

      const redirectUrl = new URL(body.redirect_uri);
      redirectUrl.searchParams.set('code', code);
      redirectUrl.searchParams.set('state', body.state);

      return res.redirect(redirectUrl.toString());
    } catch {
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Timetrack</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); width: 100%; max-width: 380px; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    p { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
    input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem; margin-bottom: 1rem; }
    button { width: 100%; padding: 0.625rem; background: #000; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
    button:hover { background: #333; }
    .error { color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Timetrack</h1>
    <p>Login untuk menghubungkan ke Claude</p>
    <div class="error">Username/password salah atau akun tidak ditemukan.</div>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="${body.redirect_uri}" />
      <input type="hidden" name="state" value="${body.state}" />
      <input type="hidden" name="client_id" value="${body.client_id}" />
      <label>Username atau Email</label>
      <input type="text" name="identifier" required autocomplete="username" />
      <label>Password</label>
      <input type="password" name="password" required autocomplete="current-password" />
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
  }

  @Post('oauth/token')
  async exchangeToken(
    @Body() body: { grant_type: string; code: string; redirect_uri: string; client_id: string; code_verifier: string },
  ) {
    if (body.grant_type !== 'authorization_code') {
      throw new BadRequestException('unsupported_grant_type');
    }

    const stored = authCodes.get(body.code);
    if (!stored) throw new BadRequestException('invalid_grant');
    if (Date.now() > stored.expiresAt) {
      authCodes.delete(body.code);
      throw new BadRequestException('invalid_grant');
    }

    authCodes.delete(body.code);

    const accessToken = await this.jwt.signAsync(
      {
        id: stored.userId,
        role: stored.role,
        username: stored.username,
        email: stored.email,
        settings: stored.settings,
      },
      { expiresIn: '30d' },
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60,
      scope: 'mcp:read',
    };
  }
}
