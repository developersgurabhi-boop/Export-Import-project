import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '../errors/app-error';
import type { AuthedRequest } from './auth-context';
import { PUBLIC_KEY } from './decorators';
import { PermissionResolver } from './permission-resolver.service';

export interface AccessTokenClaims {
  sub: string;
  orgId: string;
  sid: string;
  mfa: boolean;
}

/**
 * Global guard, runs first. Verifies the bearer token and loads the user's current
 * permissions and branch scope into req.auth. Routes marked @Public skip it.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly resolver: PermissionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = extractBearer(req.headers.authorization);
    if (!token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Missing bearer token');
    }

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, { algorithms: ['HS256'] });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired');
      }
      throw new AppError(401, 'UNAUTHENTICATED', 'Invalid access token');
    }

    const access = await this.resolver.resolve(claims.sub, claims.orgId);
    if (!access) {
      throw new AppError(401, 'UNAUTHENTICATED', 'User is not active or no longer exists');
    }

    req.auth = {
      userId: claims.sub,
      orgId: claims.orgId,
      sessionId: claims.sid,
      mfa: claims.mfa === true,
      permissions: access.permissions,
      branchScope: access.branchScope,
      isHeadOffice: access.isHeadOffice,
    };
    return true;
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
