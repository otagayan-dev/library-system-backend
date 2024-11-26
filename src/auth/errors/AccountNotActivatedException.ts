import { UnauthorizedException } from "@nestjs/common";

export class AccountNotActivatedException extends UnauthorizedException {
  constructor() {
    super(
      "Your account is not yet activated, please ask a Super-Admin for assistance",
    );
  }
}
