import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { PermissionResolver } from '../../../platform/authorization/permission-resolver.service';
import { PolicyService } from '../../../platform/authorization/policy.service';
import { AppError } from '../../../platform/errors/app-error';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import type { AssignmentInput, CreateUserInput, ListUsersQuery, UpdateUserInput } from '../dto/identity.schemas';
import { PasswordService } from '../infra/password.service';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  status: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  branchRoles: {
    select: {
      branchId: true,
      role: { select: { code: true } },
    },
  },
} satisfies Prisma.AppUserSelect;

type UserRow = Prisma.AppUserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly policy: PolicyService,
    private readonly resolver: PermissionResolver,
  ) {}

  async list(auth: AuthContext, query: ListUsersQuery) {
    const rows = await this.prisma.appUser.findMany({
      where: {
        organizationId: auth.orgId,
        ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take: query.limit + 1,
      select: userSelect,
    });

    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit).map(toUserView);
    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async get(auth: AuthContext, id: string) {
    const row = await this.prisma.appUser.findFirst({
      where: { id, organizationId: auth.orgId },
      select: userSelect,
    });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return toUserView(row);
  }

  async create(auth: AuthContext, input: CreateUserInput) {
    const assignments = await this.resolveAssignments(auth, input.assignments);
    const passwordHash = await this.password.hash(input.password);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.appUser.create({
        data: {
          organizationId: auth.orgId,
          email: input.email,
          fullName: input.fullName,
          phone: input.phone ?? null,
          passwordHash,
        },
        select: { id: true },
      });
      await tx.userBranchRole.createMany({
        data: assignments.map((a) => ({
          organizationId: auth.orgId,
          userId: user.id,
          branchId: a.branchId,
          roleId: a.roleId,
        })),
        skipDuplicates: true,
      });
      return user;
    });

    return this.get(auth, created.id);
  }

  async update(auth: AuthContext, id: string, input: UpdateUserInput) {
    const existing = await this.prisma.appUser.findFirst({
      where: { id, organizationId: auth.orgId },
      select: { id: true, version: true },
    });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'User not found');
    if (existing.version !== input.version) {
      throw new AppError(409, 'CONCURRENT_MODIFICATION', 'User was modified by someone else', {
        currentVersion: existing.version,
      });
    }
    if (id === auth.userId && input.status === 'DISABLED') {
      throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'You cannot disable your own account', {
        reason: 'SELF_DISABLE',
      });
    }

    const assignments = input.assignments
      ? await this.resolveAssignments(auth, input.assignments)
      : null;

    const data: Prisma.AppUserUpdateManyMutationInput = {
      version: { increment: 1 },
    };
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.status !== undefined) data.status = input.status;

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.appUser.updateMany({
        where: { id, organizationId: auth.orgId, version: input.version },
        data,
      });
      if (result.count === 0) {
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'User was modified by someone else');
      }
      if (assignments) {
        await tx.userBranchRole.deleteMany({ where: { userId: id } });
        await tx.userBranchRole.createMany({
          data: assignments.map((a) => ({
            organizationId: auth.orgId,
            userId: id,
            branchId: a.branchId,
            roleId: a.roleId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Permissions may have changed; do not wait for the cache TTL.
    this.resolver.invalidate(id, auth.orgId);
    return this.get(auth, id);
  }

  /**
   * Checks every branch the caller is assigning, and resolves role codes to ids.
   * Unknown branches or roles are business-rule errors, never silently dropped.
   */
  private async resolveAssignments(
    auth: AuthContext,
    assignments: readonly AssignmentInput[],
  ): Promise<{ branchId: string; roleId: string }[]> {
    const branchIds = [...new Set(assignments.map((a) => a.branchId))];
    const roleCodes = [...new Set(assignments.map((a) => a.roleCode))];
    branchIds.forEach((branchId) => this.policy.assertBranchAccess(auth, branchId));

    const [branches, roles] = await Promise.all([
      this.prisma.branch.findMany({
        where: { organizationId: auth.orgId, id: { in: branchIds } },
        select: { id: true },
      }),
      this.prisma.role.findMany({
        where: { organizationId: auth.orgId, code: { in: roleCodes } },
        select: { id: true, code: true },
      }),
    ]);

    if (branches.length !== branchIds.length) {
      throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'One or more branches do not exist', {
        reason: 'BRANCH_NOT_FOUND',
      });
    }
    const roleIdByCode = new Map(roles.map((r) => [r.code, r.id]));
    return assignments.map((a) => {
      const roleId = roleIdByCode.get(a.roleCode);
      if (!roleId) {
        throw new AppError(422, 'BUSINESS_RULE_VIOLATION', `Unknown role ${a.roleCode}`, {
          reason: 'ROLE_NOT_FOUND',
        });
      }
      return { branchId: a.branchId, roleId };
    });
  }
}

function toUserView(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignments: row.branchRoles.map((r) => ({ branchId: r.branchId, roleCode: r.role.code })),
  };
}
