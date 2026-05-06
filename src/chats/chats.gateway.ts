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

  private onlineUsers = new Map<string, Set<string>>();
  constructor(
    private readonly chatsService: ChatsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake?.auth?._id;

    if (!userId) {
      client.disconnect();
      return;
    }

    console.log('✅ Connected:', userId, client.id);

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }

    this.onlineUsers.get(userId)!.add(client.id);

    await this.userModel.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: null,
    });

    console.log('ONLINE USERS:', this.onlineUsers);
  }
  async handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.onlineUsers.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);

        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);

          await this.userModel.findByIdAndUpdate(userId, {
            online: false,
            lastSeen: new Date(),
          });

          console.log('❌ User offline:', userId);
        }

        break;
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomId: string) {
    console.log('👥 Joining room:', roomId);

    client.join(`room:${roomId}`);

    const clients = await this.server.in(`room:${roomId}`).fetchSockets();
    console.log('👥 Users in room:', clients.length);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateChatDto,
  ) {
    try {
      let senderId: string | undefined;

      for (const [uid, sockets] of this.onlineUsers.entries()) {
        if (sockets.has(client.id)) {
          senderId = uid;
          break;
        }
      }

      if (!senderId) {
        console.log('❌ No senderId for socket:', client.id);
        return;
      }

      if (!dto.room_id) {
        console.log('❌ Missing room_id');
        return;
      }

      if (!dto.content && (!dto.attachments || dto.attachments.length === 0)) {
        console.log('❌ Empty message');
        return;
      }

      console.log('📩 Message received:', dto);

      const attachments =
        dto?.attachments?.map((item: any) =>
          typeof item === 'string' ? item : item?.url,
        ) || [];

      const newMessage = await this.chatsService.create(senderId, {
        ...dto,
        attachments,
      });

      const populated = await this.chatModel
        .findById(newMessage._id)
        .populate('sender_id', '_id name avatar email')
        .lean();

      console.log('📡 Emitting to room:', dto.room_id);

      this.server.to(`room:${dto.room_id}`).emit('newMessage', populated);
    } catch (error) {
      console.error('❌ sendMessage error:', error);
    }
  }
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    let userId: string | undefined;

    for (const [uid, sockets] of this.onlineUsers.entries()) {
      console.log(sockets, uid);
      
      if (sockets.has(client.id)) {
        userId = uid;
        break;
      }
    }

    if (!userId) return;

    client.to(`room:${data.roomId}`).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }
}
