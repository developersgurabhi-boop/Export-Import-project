import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { APP_ENV } from '../../../platform/config/config.module';
import type { Env } from '../../../platform/config/env';
import { AppError } from '../../../platform/errors/app-error';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PasswordService } from '../infra/password.service';
import type { LoginInput } from '../dto/identity.schemas';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: string; email: string; fullName: string; orgId: string };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
    @Inject(APP_ENV) private readonly env: Env,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.prisma.appUser.findFirst({
      where: { email: input.email },
      select: {
        id: true,
        organizationId: true,
        email: true,
        fullName: true,
        passwordHash: true,
        status: true,
        failedAttempts: true,
        lockedUntil: true,
      },
    });

    // Same error for every failure mode: no account enumeration.
    if (!user) {
      await this.password.burnVerifyTime(input.password);
      throw invalidCredentials();
    }

    const passwordOk = await this.password.verify(user.passwordHash, input.password);
    if (!passwordOk) {
      await this.recordFailedAttempt(user.id);
      throw invalidCredentials();
    }

    const isLocked = user.lockedUntil !== null && user.lockedUntil > new Date();
    if (isLocked || user.status !== 'ACTIVE') {
      throw invalidCredentials();
    }

    await this.prisma.appUser.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      orgId: user.organizationId,
      sid: randomUUID(),
      mfa: false,
    });

    this.logger.log(`login user=${user.id}`);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.env.JWT_ACCESS_TTL_SECONDS,
      user: { id: user.id, email: user.email, fullName: user.fullName, orgId: user.organizationId },
    };
  }

  async me(auth: AuthContext) {
    const user = await this.prisma.appUser.findFirst({
      where: { id: auth.userId, organizationId: auth.orgId },
      select: { id: true, email: true, fullName: true, phone: true },
    });
    if (!user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'User no longer exists');
    }
    return {
      ...user,
      orgId: auth.orgId,
      isHeadOffice: auth.isHeadOffice,
      branchScope: [...auth.branchScope],
      permissions: [...auth.permissions].sort(),
      mfa: auth.mfa,
    };
  }

  private async recordFailedAttempt(userId: string): Promise<void> {
    const updated = await this.prisma.appUser.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });
    if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.prisma.appUser.update({
        where: { id: userId },
        data: { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_DURATION_MS) },
      });
    }
  }
}

function invalidCredentials(): AppError {
  return new AppError(401, 'UNAUTHENTICATED', 'Invalid email or password');
}
