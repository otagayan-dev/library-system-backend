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
import { Response } from "express";
import { RefreshTokenGuard } from "./refresh-token.guard";
import { UsersService } from "src/users/users.service";
import { CreateUserDto } from "src/users/dto/create-user.dto";

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
  async login(@Req() req, @Res() res: Response) {
    const { password, ...user } = await this.usersService.findOne(req.user.id);
    const { access_token, refresh_token } = await this.authService.login(
      req.user,
    );
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 5, //5min
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, //7 days
    });
    res.send(user);
  }

  /**
   * Refreshing token
   */
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  refreshToken(@Req() req, @Res() res: Response) {
    return this.login(req, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@Req() req, @Res() res: Response) {
    // Clear the access and refresh tokens by setting cookies with an immediate expiration
    res.cookie("access_token", "", {
      httpOnly: true,
      secure: false, //Should be true in production
      sameSite: "strict",
      expires: new Date(0),
    });

    res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: false, //Should be true in production
      sameSite: "strict",
      expires: new Date(0),
    });

    // Send a response confirming logout
    res.send({ message: "Successfully logged out" });
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }
}
