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
    const token = request.cookies.access_token;

    if (!token) throw new UnauthorizedException('Token not found');

    try {
      const { iat, exp, ...rest } = this.jwtService.verify(token);

      const user = {
        role: rest.role,
        username: rest.username,
        email: rest.email,
        id: rest.id,
      };

      request['user'] = user;

      if (user.role !== 'supervisor') {
        throw new UnauthorizedException('Access denied: supervisor only');
      }
      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
