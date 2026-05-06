import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schemas';
import { User, UserSchema } from 'src/users/schemas/user.schemas';
import { Room, RoomSchema } from 'src/rooms/schemas/room.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  providers: [ChatsGateway, ChatsService],
  exports: [ChatsService, MongooseModule],
})
export class ChatsModule {}
