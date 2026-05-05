import * as dotenv from 'dotenv'

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { UsersService } from "../users/users.service";

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        private readonly userService: UsersService,
    ) {
        super({
            jwtFromRequest: (req) => req?.cookies?.token,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET
        });
    }

    async validate(payload: any) {
        const user = await this.userService.findOne(payload.sub);
        return user;
    }
}