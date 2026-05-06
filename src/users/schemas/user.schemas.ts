import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
  })
  name!: string;

  @Prop({
    required: true,
    unique: true,
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
  })
  password!: string;

  @Prop({
    required: true,
    select: false,
  })
  password_key!: string;

  @Prop()
  about!: string;

  @Prop()
  birthday!: Date;

  @Prop()
  height!: number;

  @Prop()
  weight!: number;
  
  @Prop({ default: false })
  online!: boolean;

  @Prop()
  lastSeen?: Date;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
