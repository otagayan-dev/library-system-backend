import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from "rxjs";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly logger = new Logger(RefreshTokenGuard.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.body["refresh_token"];

    if (!refreshToken)
      throw new UnauthorizedException("Refresh token not found");

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      this.logger.debug("RefreshTokenGuard:Payload", {
        payload,
      });

      request.user = {
        ...payload,
        id: payload.sub,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
