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
import { AuthService } from './auth.service';
import { AuthService as AuthServiceLegacy } from './services/auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { CookieOptions, Response } from 'express';
import { JwtAuthSupervisorGuard } from 'src/guards/jwt-supervisor.guard';
import { AuthFetcherService } from './services/auth-fetcher.service';
import { CheckResetPasswordDto } from './dto/check-reset-password.dto';
import { SetResetPasswordDto } from './dto/set-reset-password.dto';

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
    private readonly legacyService: AuthServiceLegacy,
    private readonly jwt: JwtService,
    private readonly fetcher: AuthFetcherService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    const user = req.user;
    return user;
  }

  @Get('/divisions')
  async getAllDivisions() {
    return await this.fetcher.getAllDivisions();
  }

  @UseGuards(JwtAuthSupervisorGuard)
  @Get('me/supervisor')
  async getMeSupervisor(@Req() req) {
    const user = req.user;

    return user;
  }

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    return await this.legacyService.createNewProfile(body);
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
        settings: user.settings,
      },
      {
        expiresIn: '30d',
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
      email: user.email,
      id: user.id,
      role: user.role,
      username: user.username,
      settings: user.settings,
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

  @Post('check-reset-password')
  async checkResetPassword(@Body() body: CheckResetPasswordDto) {
    return await this.legacyService.checkResetPassword(body);
  }

  @Post('set-reset-password')
  async setResetPassword(@Body() body: SetResetPasswordDto) {
    return await this.legacyService.setResetPassword(body);
  }
}
