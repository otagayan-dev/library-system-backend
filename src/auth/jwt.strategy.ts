import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "./types/jwt-payload";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.["access_token"] || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate({ sub, idNumber, role, ...others }: JwtPayload) {
    return {
      id: sub,
      idNumber,
      role,
    };
  }
}
