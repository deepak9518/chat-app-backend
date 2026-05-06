import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './schemas/room.schemas';
import { CreateRoomDto } from './dto/create-room.dto';
import { Chat } from 'src/chats/schemas/chat.schemas';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    createRoomDto.members.push(userId);

    const createdRoom = new this.roomModel(createRoomDto);
    return await createdRoom.save();
  }

  async getByRequest(userId: string) {
    const rooms = await this.roomModel
      .find({ members: new Types.ObjectId(userId) })
      .exec();
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await this.chatModel.countDocuments({
          room_id: room._id as any,
          readBy: { $ne: new Types.ObjectId(userId) },
        });
        const lastMessage = await this.chatModel
          .findOne({ room_id: room._id as any })
          .sort({ createdAt: -1 })
          .select('content createdAt')
          .exec();
        return {
          ...room.toObject(),
          unreadCount,
          lastMessage: lastMessage || null,
        };
      }),
    );
    return enrichedRooms;
  }
  async findById(id: string) {
    const room = await this.roomModel.findById(id).populate('members').exec();
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }
  async findPersonalRoom(userId: string, otherUserId: string) {
    return this.roomModel
      .findOne({
        type: 'personal' as any,
        members: {
          $all: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
        },
      })
      .populate('members')
      .exec();
  }
}
