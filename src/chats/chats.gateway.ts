import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/config/guard/ws-jwt-auth.guard';
import { wsAuthMiddleware } from 'src/config/middleware/ws-auth.middleware';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schemas';
import { Room } from 'src/rooms/schemas/room.schemas';
import { Chat } from './schemas/chat.schemas';
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly chatsService: ChatsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async handleConnection(client: Socket) {
    console.log('🔥 Incoming socket:', client.id);
    console.log('🔥 Auth data:', client.handshake);

    const userId = client.handshake?.auth?._id;

    if (!userId) {
      console.log('❌ No userId → disconnect');
      client.disconnect();
      return;
    }

    console.log('✅ Connected user:', userId);

    this.onlineUsers.set(client.id, userId);

    await this.userModel.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: null,
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    if (!userId) return;

    this.onlineUsers.delete(client.id);

    await this.userModel.findByIdAndUpdate(userId, {
      online: false,
      lastSeen: new Date(),
    });
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomId: string) {
    console.log('👥 Joining room:', roomId);

    client.join(`room:${roomId}`);

    const clients = await this.server.in(`room:${roomId}`).fetchSockets();
    console.log('👥 Users in room:', clients.length);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, dto: CreateChatDto) {
    const senderId = this.onlineUsers.get(client.id);
    if (!senderId) return;

    console.log('📩 Message received:', dto);

    const newMessage = await this.chatsService.create(senderId, dto);

    const populated = await this.chatModel
      .findById(newMessage._id)
      .populate('sender_id')
      .exec();

    console.log('📡 Emitting to room:', dto.room_id);

    this.server
      .to(`room:${dto.room_id}`)
      .emit('newMessage', populated);
  }
}