import { Controller, Post, UseGuards, Get, Res, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Response } from "express";
import { RefreshTokenGuard } from "./refresh-token.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Req() req, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.login(
      req.user,
    );

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60, //60s
    });
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, //7 days
    });
    res.send({ message: "Login successful" });
  }

  /**
   * Refreshing token
   */
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  refreshToken(@Req() req, @Res() res: Response) {
    return this.login(req, res);
  }

  @UseGuards(LocalAuthGuard)
  @Post("logout")
  logout(@Req() req, @Res() res: Response) {
    // Clear the access and refresh tokens by setting cookies with an immediate expiration
    res.cookie("access_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(0),
    });

    res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(0),
    });

    // Send a response confirming logout
    res.send({ message: "Successfully logged out" });
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req) {
    return req.user;
  }
}
