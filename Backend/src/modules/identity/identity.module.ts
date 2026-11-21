import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { RolesController } from './api/roles.controller';
import { UsersController } from './api/users.controller';
import { AuthService } from './application/auth.service';
import { RolesService } from './application/roles.service';
import { UsersService } from './application/users.service';
import { PasswordService } from './infra/password.service';

@Module({
  controllers: [AuthController, UsersController, RolesController],
  providers: [AuthService, UsersService, RolesService, PasswordService],
})
export class IdentityModule {}
