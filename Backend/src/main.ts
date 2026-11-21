import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { parseEnv } from './platform/config/env';

async function bootstrap(): Promise<void> {
  const env = parseEnv(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });
  app.enableShutdownHooks();

  await app.listen(env.PORT);
  Logger.log(`TMS API listening on port ${env.PORT} (role=${env.APP_ROLE})`, 'Bootstrap');
}

void bootstrap();
