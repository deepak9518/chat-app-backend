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

  @Post('login')
  async login(@Body() dto: LoginAuthDto, @Res({ passthrough: true }) res) {
    const { data, message } = await this.authService.login(dto);

    res.cookie('token', data.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return {
      message: message || 'User logged in successfully',
      data,
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterAuthDto,
    @Res({ passthrough: true }) res,
  ) {
    const { data, message } = await this.authService.register(dto);

    res.cookie('token', data.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return { message, user: data.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Request() req) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }
}
