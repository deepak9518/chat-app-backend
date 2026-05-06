import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/guard/jwt-auth.guard';
import { GetChatDto } from 'src/chats/dto/get-chat.dto';
import { ChatsService } from 'src/chats/chats.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(req.user._id.toString(), createRoomDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getByRequest(@Request() req) {
    return this.roomsService.getByRequest(req.user._id.toString());
  }

  @Get('personal/:userId')
  async getPersonalRoom(@Request() req, @Param('userId') otherUserId: string) {
    return this.roomsService.findPersonalRoom(req.user._id, otherUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getById(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }
  @Get(':roomId/chats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getChats(
    @Param('roomId') roomId: string,
    @Query() query: GetChatDto,
    @Request() req,
  ) {
    return this.chatsService.findAll(roomId, query);
  }
}
