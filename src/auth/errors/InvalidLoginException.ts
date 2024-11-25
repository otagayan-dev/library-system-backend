import { UnauthorizedException } from "@nestjs/common";

export class InvalidLoginException extends UnauthorizedException {
  constructor() {
    super("Invalid ID number or password. Please try again.");
  }
}
