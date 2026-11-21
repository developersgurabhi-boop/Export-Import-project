import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma client for CRUD. Connection is opened lazily on first query, so the app
 * can boot (and tests can compile the module) without a reachable database.
 * Prisma is only used inside infra/ and platform/ folders (see spec section 4).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
