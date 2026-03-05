import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthSupervisorGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.access_token;

    if (!token) throw new UnauthorizedException('Token not found');

    try {
      const { iat, exp, ...rest } = await this.jwtService.verifyAsync(token);

      const user = {
        role: rest.role,
        username: rest.username,
        email: rest.email,
        id: rest.id,
      };

      request['user'] = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
