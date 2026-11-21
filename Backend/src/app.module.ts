import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthorizationModule } from './platform/authorization/authorization.module';
import { ConfigModule } from './platform/config/config.module';
import { ProblemDetailsFilter } from './platform/errors/problem-details.filter';
import { HealthController } from './platform/health/health.controller';
import { RequestIdMiddleware } from './platform/http/request-id.middleware';
import { PrismaModule } from './platform/prisma/prisma.module';
import { IdentityModule } from './modules/identity';

@Module({
  imports: [ConfigModule, PrismaModule, AuthorizationModule, IdentityModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
