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
import { CookieOptions, Response } from 'express';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';

@Controller('auth')
export class AuthController {
  private readonly supervisorCookiesOption: CookieOptions = {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production',
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  };

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
    const token = await this.jwt.signAsync({
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    });

    res.cookie('access_token', token, this.supervisorCookiesOption);

    return { message: 'Login Success', accessToken: token };
  }

  @Post('logout/supervisor')
  async logoutSupervisor(@Res({ passthrough: true }) res: Response) {
    const { maxAge, ...rest } = this.supervisorCookiesOption;
    res.clearCookie('access_token', rest);

    return { message: 'Logout success' };
  }
}
