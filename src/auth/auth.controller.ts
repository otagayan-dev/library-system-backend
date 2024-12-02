import {
  Controller,
  Post,
  UseGuards,
  Get,
  Res,
  Req,
  Body,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RefreshTokenGuard } from "./refresh-token.guard";
import { UsersService } from "src/users/users.service";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { User } from "src/users/entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post("register")
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, {
      action: "register",
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Req() req): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const { password, ...user } = await this.usersService.findOne(req.user.id);
    const { refreshToken, accessToken } = await this.authService.login(
      req.user,
    );

    return {
      user,
      refreshToken,
      accessToken,
    } as any;
  }

  /**
   * Refreshing token
   */
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  refreshToken(@Req() req): Promise<{
    refreshToken: string;
    accessToken: string;
  }> {
    return this.login(req);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }
}
