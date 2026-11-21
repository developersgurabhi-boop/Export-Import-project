import { Injectable } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import type { AuthContext } from './auth-context';

/**
 * Branch-scope rules (spec 6.3). Reads filter with scopeWhere(); writes call assertBranchAccess().
 * Out-of-scope reads should look like "not found", so callers filter instead of checking.
 */
@Injectable()
export class PolicyService {
  assertBranchAccess(auth: AuthContext, branchId: string): void {
    if (auth.isHeadOffice) return;
    if (!auth.branchScope.includes(branchId)) {
      throw new AppError(403, 'BRANCH_ACCESS_DENIED', 'No access to this branch');
    }
  }

  /** Prisma where-clause fragment limiting a branch_id column to the user's scope. */
  scopeWhere(auth: AuthContext): { branchId?: { in: string[] } } {
    if (auth.isHeadOffice) return {};
    return { branchId: { in: [...auth.branchScope] } };
  }
}
