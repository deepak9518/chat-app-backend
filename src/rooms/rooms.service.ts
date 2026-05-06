import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Room } from './schemas/room.schemas';
import { CreateRoomDto } from './dto/create-room.dto';

import { Chat } from 'src/chats/schemas/chat.schemas';
import { User } from 'src/users/schemas/user.schemas';

const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8);

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<Room>,

    @InjectModel(Chat.name)
    private chatModel: Model<Chat>,

    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    const { members = [], inviteEmails = [], ...rest } = createRoomDto;

    const uniqueMembers = Array.from(new Set([...members, userId]));

    const inviteCode = generateInviteCode();

    const createdRoom = new this.roomModel({
      ...rest,
      members: uniqueMembers,
      inviteEmails,
      inviteCode,
    });

    return await createdRoom.save();
  }

  async getByRequest(userId: string, userEmail: string) {
    const userObjectId = new Types.ObjectId(userId);

    const rooms = await this.roomModel
      .find({
        $or: [
          { members: { $in: [userObjectId] } },
          { inviteEmails: userEmail },
        ],
      })
      .populate({
        path: 'members',
        select: '_id name email avatar online lastSeen',
      })
      .lean();

    const enrichedRooms = await Promise.all(
      rooms.map(async (room: any) => {
        const invitedUsers = await this.userModel
          .find({
            email: { $in: room.inviteEmails || [] },
          })
          .select('_id name email avatar online lastSeen')
          .lean();

        const unreadCount = await this.chatModel.countDocuments({
          room_id: room._id,
          readBy: {
            $nin: [userObjectId],
          },
        });

        const lastMessage = await this.chatModel
          .findOne({
            room_id: room._id,
          })
          .sort({ createdAt: -1 })
          .populate('sender_id', '_id name avatar')
          .lean();

        return {
          ...room,
          invitedUsers,
          unreadCount,
          lastMessage,
        };
      }),
    );

    return enrichedRooms;
  }

  async findById(id: string) {
    const room = await this.roomModel
      .findById(id)
      .populate({
        path: 'members',
        select: '_id name email avatar online lastSeen',
      })
      .lean();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const invitedUsers = await this.userModel
      .find({
        email: { $in: room.inviteEmails || [] },
      })
      .select('_id name email avatar online lastSeen')
      .lean();

    return {
      ...room,
      invitedUsers,
    };
  }

  async findPersonalRoom(userId: string, otherUserId: string) {
    return this.roomModel
      .findOne({
        type: 'personal' as any,
        members: {
          $all: [
            new Types.ObjectId(userId),
            new Types.ObjectId(otherUserId),
          ],
        },
      })
      .populate({
        path: 'members',
        select: '_id name email avatar online lastSeen',
      })
      .lean();
  }

  async joinViaInvite(roomId: string, user: any) {
    const room = await this.roomModel.findById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (
      room.members.some(
        (m) => m.toString() === user._id.toString(),
      )
    ) {
      return room;
    }

    if (room.inviteEmails?.includes(user.email)) {
      room.members.push(user._id);

      room.inviteEmails = room.inviteEmails.filter(
        (email) => email !== user.email,
      );

      await room.save();

      return room;
    }

    throw new ForbiddenException('Not invited to this room');
  }

  async joinViaCode(code: string, user: any) {
    const room = await this.roomModel.findOne({
      inviteCode: code,
    });

    if (!room) {
      throw new NotFoundException('Invalid invite');
    }

    if (
      room.members.some(
        (m) => m.toString() === user._id.toString(),
      )
    ) {
      return room;
    }

    if (room.inviteEmails?.includes(user.email)) {
      room.members.push(user._id);

      room.inviteEmails = room.inviteEmails.filter(
        (e) => e !== user.email,
      );

      await room.save();

      return room;
    }

    throw new ForbiddenException('Not invited');
  }
}