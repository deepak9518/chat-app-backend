import {
  Controller,
  Body,
  Patch,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/config/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user._id.toString(), updateUserDto);
  }
  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Request() req) {
    return this.usersService.findAllExcept(req.user._id);
  }
}
