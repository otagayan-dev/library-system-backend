import { Injectable, Logger } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { InvalidLoginException } from "./errors/InvalidLoginException";
import { User } from "src/users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./types/jwt-payload";
import * as bcrypt from "bcrypt";
import { Role } from "src/users/enums/role.enum";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
   * @param idNumber
   * @param password
   * @returns {User}
   * @throws {InvalidLoginException} if invalid login credentials
   */
  async validateUser(idNumber: string, password: string): Promise<User> {
    const user = await this.usersService.findByIdNumber(idNumber);
    if (user === null) throw new InvalidLoginException();
    if (user.role === Role.User) throw new InvalidLoginException();
    await this.validatePassword(password, user.password);
    this.logger.debug("AuthService:ValidateUser", {
      user,
    });
    return user;
  }

  async login(user: User): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const { id, idNumber, role } = user;
    const payload: JwtPayload = {
      sub: id,
      idNumber,
      role,
    };
    this.logger.debug("AuthService:Login", { user, payload });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: "7d",
      }),
    };
  }
}
