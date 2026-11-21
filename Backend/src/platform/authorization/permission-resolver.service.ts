import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PermissionCode } from './permissions';

export interface ResolvedAccess {
  permissions: ReadonlySet<PermissionCode>;
  branchScope: readonly string[];
  isHeadOffice: boolean;
}

const CACHE_TTL_MS = 45_000;

/**
 * Loads a user's effective permissions and branch scope from the role assignments.
 * Results are cached in-process for about 45 s (spec 6.3); invalidate() clears an entry
 * immediately when roles or status change. Returns null when the user is missing,
 * inactive, or in another organization.
 */
@Injectable()
export class PermissionResolver {
  private readonly cache = new Map<string, { expiresAt: number; value: ResolvedAccess }>();

  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string, orgId: string): Promise<ResolvedAccess | null> {
    const key = this.key(userId, orgId);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const user = await this.prisma.appUser.findFirst({
      where: { id: userId, organizationId: orgId },
      select: {
        status: true,
        branchRoles: {
          select: {
            branchId: true,
            role: {
              select: {
                isHeadOffice: true,
                permissions: { select: { permissionCode: true } },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      this.cache.delete(key);
      return null;
    }

    const permissions = new Set<PermissionCode>();
    const branchIds = new Set<string>();
    let isHeadOffice = false;

    for (const assignment of user.branchRoles) {
      branchIds.add(assignment.branchId);
      if (assignment.role.isHeadOffice) isHeadOffice = true;
      for (const grant of assignment.role.permissions) {
        permissions.add(grant.permissionCode as PermissionCode);
      }
    }

    const value: ResolvedAccess = {
      permissions,
      branchScope: [...branchIds],
      isHeadOffice,
    };
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  invalidate(userId: string, orgId: string): void {
    this.cache.delete(this.key(userId, orgId));
  }

  private key(userId: string, orgId: string): string {
    return `${orgId}:${userId}`;
  }
}
