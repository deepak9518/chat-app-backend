import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schemas';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

const generateRandomString = (length: number): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};
export const hashPassword = async (
  password: string,
): Promise<{ hash: string; passKey: string }> => {
  const passKey = generateRandomString(10);

  const hash = await bcrypt.hash(password + passKey, 10);

  return {
    passKey,
    hash,
  };
};

const comparePassword = async (
  password: string,
  passKey: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password + passKey, hash);
};
const USER_SAFE_FIELDS =
  '_id name email online lastSeen avatar createdAt updatedAt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(dto: RegisterAuthDto) {
    const passwordGenerator = await hashPassword(dto.password!);
    dto.password = passwordGenerator.hash;

    const createdUser = new this.userModel({
      ...dto,
      password_key: passwordGenerator.passKey,
    });

    try {
      const saved = await createdUser.save();

      return saved;
    } catch (error) {
      throw new BadRequestException((error as any).message);
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('+password +password_key')
      .exec();

    if (!user) {
      throw new NotFoundException('Could not find user.');
    }

    const isPasswordCorrect = await comparePassword(
      password,
      user.password_key,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new NotFoundException('Could not find user.');
    }

    return user;
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select(USER_SAFE_FIELDS)
      .lean();

    if (!user) {
      throw new NotFoundException('Could not find user.');
    }

    return user;
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select(USER_SAFE_FIELDS)
      .lean();

    if (!updatedUser) {
      throw new NotFoundException('Could not find user.');
    }

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async findAllExcept(userId: string) {
    return this.userModel
      .find({ _id: { $ne: new Types.ObjectId(userId) } })
      .select(USER_SAFE_FIELDS)
      .lean();
  }
}
