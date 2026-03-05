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
import { Response } from 'express';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';

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

  @UseGuards(JwtAuthSupervisorGuard)
  @Get('me/supervisor')
  async getMeSupervisor(@Req() req) {
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

  @Post('/login/supervisor')
  async loginSupervisor(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.service.login(body, true);
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

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return { message: 'Login Success' };
  }
}
