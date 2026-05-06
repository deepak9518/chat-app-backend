import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { JwtAuthGuard } from 'src/config/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };

  @Post('login')
  async login(@Body() dto: LoginAuthDto, @Res({ passthrough: true }) res) {
    const { data, message } = await this.authService.login(dto);

    res.cookie('token', data.token, this.cookieOptions);

    return {
      message: message || 'User logged in successfully',
      data,
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, message } = await this.authService.register(dto);

    res.cookie('token', data.token, this.cookieOptions);

    return {
      message,
      user: data.user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Request() req) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res) {
    res.clearCookie('token', this.cookieOptions);

    return {
      message: 'Logged out successfully',
    };
  }
}
