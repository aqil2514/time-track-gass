import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    return await this.service.createNewProfile(body);
  }
}
