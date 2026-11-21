import type { Request } from 'express';
import type { PermissionCode } from './permissions';

/** Per-request identity and access, built by JwtAuthGuard. Replaces ad-hoc req.user. */
export interface AuthContext {
  userId: string;
  orgId: string;
  sessionId: string;
  mfa: boolean;
  permissions: ReadonlySet<PermissionCode>;
  /** Branch ids the user holds any role in. Empty for head office users with no explicit branch. */
  branchScope: readonly string[];
  isHeadOffice: boolean;
}

export type AuthedRequest = Request & {
  requestId?: string;
  auth?: AuthContext;
};
