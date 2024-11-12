import { Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { InvalidLoginException } from "./errors/InvalidLoginException";
import { User } from "src/users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./types/jwt-payload";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   *
   * @param password
   * @param hashedPassword
   * @throws {InvalidLoginException} if password doesn't match
   */
  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) throw new InvalidLoginException();
  }

  /**
   *
   * @param username
   * @param password
   * @returns {User}
   * @throws {InvalidLoginException} if invalid login credentials
   */
  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    if (user === null) throw new InvalidLoginException();
    await this.validatePassword(password, user.password);
    return user;
  }

  async login(user: User): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const { firstName, lastName, id, username, role } = user;
    const payload: JwtPayload = {
      sub: id,
      firstName,
      lastName,
      username,
      role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: "7d",
      }),
    };
  }
}
