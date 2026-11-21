import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { APP_ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionResolver } from './permission-resolver.service';
import { PermissionsGuard } from './permissions.guard';
import { PolicyService } from './policy.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [APP_ENV],
      useFactory: (env: Env) => ({
        secret: env.JWT_ACCESS_SECRET,
        signOptions: { algorithm: 'HS256', expiresIn: env.JWT_ACCESS_TTL_SECONDS },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  providers: [
    PermissionResolver,
    PolicyService,
    // Order matters: authenticate first, then authorize.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [JwtModule, PermissionResolver, PolicyService],
})
export class AuthorizationModule {}
