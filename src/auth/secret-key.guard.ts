import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class SecretKeyGuard implements CanActivate {
  private readonly logger = new Logger(SecretKeyGuard.name);
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const requestSecretKey = request.headers["x-secret-key"];
    const secretKey = process.env.SECRET_KEY;

    const canActivate = requestSecretKey && secretKey === requestSecretKey;

    if (canActivate) {
      request.bypassGuards = true; // To bypass other guards
    }

    this.logger.debug({
      secretKey,
      requestSecretKey,
      canActivate,
    });

    return true;
  }
}
