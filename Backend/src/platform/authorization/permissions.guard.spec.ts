import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthContext, AuthedRequest } from './auth-context';
import { Authenticated, Public, RequirePermission } from './decorators';
import { PermissionsGuard } from './permissions.guard';
import type { PermissionCode } from './permissions';

class SampleController {
  @RequirePermission('lr:create')
  create(): void {}

  @RequirePermission('invoice:cancel')
  cancelInvoice(): void {}

  @RequirePermission('lr:read', 'lr:book')
  readAndBook(): void {}

  @Public()
  health(): void {}

  @Authenticated()
  me(): void {}

  undeclared(): void {}
}

function auth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    userId: 'user-1',
    orgId: 'org-1',
    sessionId: 'sess-1',
    mfa: false,
    permissions: new Set<PermissionCode>(['lr:create', 'lr:read', 'lr:book', 'invoice:cancel']),
    branchScope: ['branch-1'],
    isHeadOffice: false,
    ...overrides,
  };
}

function ctxFor(handler: keyof SampleController, req: Partial<AuthedRequest>): ExecutionContext {
  return {
    getHandler: () => SampleController.prototype[handler],
    getClass: () => SampleController,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('denies a route that declares no permission (deny by default)', () => {
    expect(() => guard.canActivate(ctxFor('undeclared', { auth: auth() }))).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it('allows a route when the user holds the permission', () => {
    expect(guard.canActivate(ctxFor('create', { auth: auth() }))).toBe(true);
  });

  it('denies a route when the user lacks the permission', () => {
    try {
      guard.canActivate(ctxFor('create', { auth: auth({ permissions: new Set() }) }));
      fail('expected FORBIDDEN');
    } catch (error) {
      expect(error).toMatchObject({ status: 403, code: 'FORBIDDEN' });
    }
  });

  it('requires every listed permission, not just one', () => {
    const onlyRead = auth({ permissions: new Set<PermissionCode>(['lr:read']) });
    expect(() => guard.canActivate(ctxFor('readAndBook', { auth: onlyRead }))).toThrow();
    const both = auth({ permissions: new Set<PermissionCode>(['lr:read', 'lr:book']) });
    expect(guard.canActivate(ctxFor('readAndBook', { auth: both }))).toBe(true);
  });

  it('refuses MFA-gated permissions when the session is not MFA-verified', () => {
    try {
      guard.canActivate(ctxFor('cancelInvoice', { auth: auth({ mfa: false }) }));
      fail('expected MFA_REQUIRED');
    } catch (error) {
      expect(error).toMatchObject({ status: 403, code: 'MFA_REQUIRED' });
    }
  });

  it('allows MFA-gated permissions on an MFA-verified session', () => {
    expect(guard.canActivate(ctxFor('cancelInvoice', { auth: auth({ mfa: true }) }))).toBe(true);
  });

  it('skips checks on @Public routes even without a token', () => {
    expect(guard.canActivate(ctxFor('health', {}))).toBe(true);
  });

  it('requires a session on @Authenticated routes but not a specific permission', () => {
    expect(guard.canActivate(ctxFor('me', { auth: auth({ permissions: new Set() }) }))).toBe(true);
    expect(() => guard.canActivate(ctxFor('me', {}))).toThrow(expect.objectContaining({ status: 401 }));
  });
});
