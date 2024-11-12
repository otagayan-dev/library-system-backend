import { UnauthorizedException } from "@nestjs/common";

export class InvalidLoginException extends UnauthorizedException {
  constructor() {
    super("Invalid username or password. Please try again.");
  }
}
