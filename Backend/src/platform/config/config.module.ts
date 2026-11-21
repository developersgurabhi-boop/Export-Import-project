import { Global, Module } from '@nestjs/common';
import { parseEnv, type Env } from './env';

export const APP_ENV = 'APP_ENV';

@Global()
@Module({
  providers: [{ provide: APP_ENV, useFactory: (): Env => parseEnv(process.env) }],
  exports: [APP_ENV],
})
export class ConfigModule {}
