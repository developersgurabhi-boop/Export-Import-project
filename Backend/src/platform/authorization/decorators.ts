import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from './permissions';

export const PERMISSIONS_KEY = 'authz:permissions';
export const PUBLIC_KEY = 'authz:public';
export const AUTHENTICATED_KEY = 'authz:authenticated';

/**
 * Declares the permissions a route needs. All listed permissions are required.
 * Typed against the catalogue, so a typo is a compile error.
 * Routes without a declaration are denied (deny by default).
 */
export const RequirePermission = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Route is reachable without a token (login, refresh, health). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Route needs a valid session but no specific permission (for example, GET /auth/me). */
export const Authenticated = () => SetMetadata(AUTHENTICATED_KEY, true);
