import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    const user = req.user;
    return user;
  }

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    return await this.service.createNewProfile(body);
  }

  @Post('/login')
  async login(@Body() body: LoginDto) {
    const user = await this.service.login(body);

    const token = await this.jwt.signAsync(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email,
      },
      {
        expiresIn: '1d',
      },
    );

    return { message: 'Login successful', token };
  }
}
