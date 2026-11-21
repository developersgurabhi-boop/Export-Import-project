import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { AppError, type ErrorCode } from './app-error';

interface ProblemBody {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  detail: string;
  requestId?: string;
  [extension: string]: unknown;
}

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_FAILED',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONCURRENT_MODIFICATION',
};

/**
 * Renders every error as RFC 7807 problem+json with a stable `code` and the X-Request-Id.
 * Unknown errors are logged with stack traces and returned without internal details.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ErrorHandler');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    const { status, body } = this.toProblem(exception);
    body.requestId = req.requestId;

    if (status >= 500) {
      this.logger.error(
        `requestId=${req.requestId} ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).type('application/problem+json').json(body);
  }

  private toProblem(exception: unknown): { status: number; body: ProblemBody } {
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        body: this.problem(exception.getStatus(), exception.code, exception.message, exception.extensions),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { status: 409, body: this.problem(409, 'DUPLICATE_RESOURCE', 'A record with the same unique value already exists') };
      }
      if (exception.code === 'P2025') {
        return { status: 404, body: this.problem(404, 'NOT_FOUND', 'Resource not found') };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
      const message = status >= 500 ? 'Internal server error' : exception.message;
      return { status, body: this.problem(status, code, message) };
    }

    return {
      status: 500,
      body: this.problem(500, 'INTERNAL_ERROR', 'Internal server error'),
    };
  }

  private problem(
    status: number,
    code: ErrorCode,
    detail: string,
    extensions?: Record<string, unknown>,
  ): ProblemBody {
    return {
      type: 'about:blank',
      title: HttpStatus[status] ? String(HttpStatus[status]).replace(/_/g, ' ').toLowerCase() : 'error',
      status,
      code,
      detail,
      ...extensions,
    };
  }
}
