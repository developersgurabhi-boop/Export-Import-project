import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthContext, AuthedRequest } from './auth-context';

/** Injects the AuthContext set by JwtAuthGuard. Only valid on authenticated routes. */
export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.auth) {
    throw new Error('CurrentAuth used on a route without authentication');
  }
  return req.auth;
});
