import { DiscoveryModule, DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PATH_METADATA } from '@nestjs/common/constants';
import { AppModule } from '../../app.module';
import { AUTHENTICATED_KEY, PERMISSIONS_KEY, PUBLIC_KEY } from './decorators';

/**
 * Route scan (spec 6.3): every HTTP route must declare @Public, @Authenticated or
 * @RequirePermission. A new route without one fails this test before it can ship.
 */
describe('Route authorization coverage', () => {
  it('every route declares a permission, @Authenticated, or @Public', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, DiscoveryModule] }).compile();
    const discovery = moduleRef.get(DiscoveryService);
    const reflector = moduleRef.get(Reflector);
    const scanner = new MetadataScanner();

    const undeclared: string[] = [];
    const routes: string[] = [];

    for (const wrapper of discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;
      const prototype = Object.getPrototypeOf(instance) as object;

      for (const methodName of scanner.getAllMethodNames(prototype)) {
        const handler = (prototype as Record<string, unknown>)[methodName] as (...args: unknown[]) => unknown;
        if (Reflect.getMetadata(PATH_METADATA, handler) === undefined) continue;

        const label = `${metatype.name}.${methodName}`;
        routes.push(label);

        const declared =
          reflector.get<boolean>(PUBLIC_KEY, handler) === true ||
          reflector.get<boolean>(AUTHENTICATED_KEY, handler) === true ||
          (reflector.get<string[]>(PERMISSIONS_KEY, handler)?.length ?? 0) > 0;

        if (!declared) undeclared.push(label);
      }
    }

    expect(routes.length).toBeGreaterThan(0);
    expect(undeclared).toEqual([]);
    await moduleRef.close();
  });
});
