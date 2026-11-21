import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../../platform/authorization/decorators';
import { CurrentAuth } from '../../../platform/authorization/current-auth.decorator';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { ZodValidationPipe } from '../../../platform/validation/zod-validation.pipe';
import { UsersService } from '../application/users.service';
import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
  type CreateUserInput,
  type ListUsersQuery,
  type UpdateUserInput,
} from '../dto/identity.schemas';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('user:manage')
  list(
    @CurrentAuth() auth: AuthContext,
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQuery,
  ) {
    return this.users.list(auth, query);
  }

  @Post()
  @RequirePermission('user:manage')
  create(
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
  ) {
    return this.users.create(auth, body);
  }

  @Get(':id')
  @RequirePermission('user:manage')
  get(@CurrentAuth() auth: AuthContext, @Param('id', new ZodValidationPipe(idParamSchema)) id: string) {
    return this.users.get(auth, id);
  }

  @Patch(':id')
  @RequirePermission('user:manage')
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id', new ZodValidationPipe(idParamSchema)) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
  ) {
    return this.users.update(auth, id, body);
  }
}
