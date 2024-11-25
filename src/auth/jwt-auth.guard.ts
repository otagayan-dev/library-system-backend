import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Check if SecretKeyGuard has validated the request
    if (request.bypassGuards) {
      return true; // Skip JWT validation
    }

    // Proceed with default JWT validation
    // @ts-ignore
    return super.canActivate(context);
  }
}
