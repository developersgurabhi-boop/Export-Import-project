import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../errors/app-error';
import type { AuthedRequest } from './auth-context';
import { AUTHENTICATED_KEY, PERMISSIONS_KEY, PUBLIC_KEY } from './decorators';
import { MFA_REQUIRED_PERMISSIONS, type PermissionCode } from './permissions';

/**
 * Global guard, runs after JwtAuthGuard. Deny by default: a route must declare
 * @Public, @Authenticated, or @RequirePermission(...). Anything else is refused.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const auth = req.auth;
    if (!auth) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    if (this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, targets)) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionCode[] | undefined>(
      PERMISSIONS_KEY,
      targets,
    );
    if (!required || required.length === 0) {
      throw new AppError(403, 'FORBIDDEN', 'Route has no permission declaration');
    }

    for (const permission of required) {
      if (!auth.permissions.has(permission)) {
        throw new AppError(403, 'FORBIDDEN', `Missing permission ${permission}`);
      }
      if (MFA_REQUIRED_PERMISSIONS.has(permission) && !auth.mfa) {
        throw new AppError(403, 'MFA_REQUIRED', `${permission} requires an MFA-verified session`);
      }
    }
    return true;
  }
}
