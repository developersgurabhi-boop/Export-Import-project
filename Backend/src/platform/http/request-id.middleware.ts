import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../authorization/auth-context';

/** Sets req.requestId (from the caller's X-Request-Id when it is a sane value) and echoes it back. */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: AuthedRequest, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
