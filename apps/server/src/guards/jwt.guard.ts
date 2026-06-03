import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token');

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token);
      const { iat, exp, ...rest } = payload;
      const user = {
        role: rest.role,
        username: rest.username,
        email: rest.email,
        id: rest.id,
        settings: rest.settings
      };

      request['user'] = { iat, exp, user };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
