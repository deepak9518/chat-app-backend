import { IsNotEmpty, IsOptional, IsArray } from "class-validator";

export class CreateChatDto {
    @IsNotEmpty()
    readonly room_id!: string;

    @IsNotEmpty()
    readonly content!: string;

    @IsOptional()
    @IsArray()
    readonly attachments?: { url: string; type: string; name: string }[];
}