import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(auth: AuthContext) {
    const roles = await this.prisma.role.findMany({
      where: { organizationId: auth.orgId },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        isHeadOffice: true,
        permissions: { select: { permissionCode: true }, orderBy: { permissionCode: 'asc' } },
      },
    });
    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      isHeadOffice: role.isHeadOffice,
      permissions: role.permissions.map((p) => p.permissionCode),
    }));
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, description: true },
    });
  }
}
