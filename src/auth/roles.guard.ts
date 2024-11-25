import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/enums/role.enum";

const RoleScore: Record<Role, number> = {
  [Role.User]: 1,
  [Role.Admin]: 2,
  [Role.SuperAdmin]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // This should be populated by JwtAuthGuard

    if (
      !user ||
      !requiredRoles.some((role) => RoleScore[role] <= RoleScore[user.role])
    ) {
      throw new ForbiddenException(
        "You do not have permission to access this resource.",
      );
    }

    return true; // User has one of the required roles
  }
}
