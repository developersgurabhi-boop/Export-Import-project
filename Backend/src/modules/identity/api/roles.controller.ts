import { Controller, Get } from '@nestjs/common';
import { RequirePermission } from '../../../platform/authorization/decorators';
import { CurrentAuth } from '../../../platform/authorization/current-auth.decorator';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { RolesService } from '../application/roles.service';

@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  @RequirePermission('user:manage')
  listRoles(@CurrentAuth() auth: AuthContext) {
    return this.roles.listRoles(auth);
  }

  @Get('permissions')
  @RequirePermission('user:manage')
  listPermissions() {
    return this.roles.listPermissions();
  }
}
