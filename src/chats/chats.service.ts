import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './schemas/chat.schemas';
import { Model, Types } from 'mongoose';
import { GetChatDto } from './dto/get-chat.dto';

@Injectable()
export class ChatsService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async create(senderId: string, createChatDto: CreateChatDto) {
    console.log(typeof createChatDto.attachments);

    const createdChat = new this.chatModel({
      ...createChatDto,
      sender_id: new Types.ObjectId(senderId),
      readBy: [new Types.ObjectId(senderId)],
    });
    return createdChat.save();
  }
  async findAll(roomId: string, getChatDto: GetChatDto) {
    const query: any = { room_id: new Types.ObjectId(roomId) };
    if (getChatDto.last_id) {
      query._id = { $lt: new Types.ObjectId(getChatDto.last_id) };
    }
    return this.chatModel
      .find(query)
      .populate('sender_id')
      .sort({ createdAt: -1 })
      .limit(Number(getChatDto.limit || 50));
  }
}
