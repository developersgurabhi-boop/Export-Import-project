import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthedRequest } from './auth-context';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionResolver } from './permission-resolver.service';
import { Public } from './decorators';

class Sample {
  @Public()
  open(): void {}
  closed(): void {}
}

const SECRET = 'unit-test-secret-that-is-at-least-32-characters-long';

function ctx(handler: 'open' | 'closed', req: Partial<AuthedRequest>): ExecutionContext {
  return {
    getHandler: () => Sample.prototype[handler],
    getClass: () => Sample,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET, signOptions: { algorithm: 'HS256' } });
  const resolver = { resolve: jest.fn() } as unknown as PermissionResolver;
  const guard = new JwtAuthGuard(new Reflector(), jwt, resolver);

  beforeEach(() => jest.clearAllMocks());

  it('skips authentication on @Public routes', async () => {
    await expect(guard.canActivate(ctx('open', {}))).resolves.toBe(true);
  });

  it('rejects a request with no bearer token', async () => {
    await expect(guard.canActivate(ctx('closed', { headers: {} }))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a malformed token', async () => {
    await expect(
      guard.canActivate(ctx('closed', { headers: { authorization: 'Bearer not-a-jwt' } })),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('reports TOKEN_EXPIRED for an expired token', async () => {
    const expired = await jwt.signAsync(
      { sub: 'u', orgId: 'o', sid: 's', mfa: false, iat: 1, exp: 2 },
    );
    await expect(
      guard.canActivate(ctx('closed', { headers: { authorization: `Bearer ${expired}` } })),
    ).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
  });

  it('rejects when the user is inactive or missing (resolver returns null)', async () => {
    (resolver.resolve as jest.Mock).mockResolvedValue(null);
    const token = await jwt.signAsync({ sub: 'u', orgId: 'o', sid: 's', mfa: false });
    await expect(
      guard.canActivate(ctx('closed', { headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  it('attaches the AuthContext built from claims and current permissions', async () => {
    (resolver.resolve as jest.Mock).mockResolvedValue({
      permissions: new Set(['lr:read']),
      branchScope: ['b1'],
      isHeadOffice: false,
    });
    const token = await jwt.signAsync({ sub: 'u1', orgId: 'o1', sid: 's1', mfa: true });
    const req: Partial<AuthedRequest> = { headers: { authorization: `Bearer ${token}` } };

    await expect(guard.canActivate(ctx('closed', req))).resolves.toBe(true);
    expect(req.auth).toEqual({
      userId: 'u1',
      orgId: 'o1',
      sessionId: 's1',
      mfa: true,
      permissions: new Set(['lr:read']),
      branchScope: ['b1'],
      isHeadOffice: false,
    });
  });
});
