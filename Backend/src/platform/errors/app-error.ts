import { HttpException } from '@nestjs/common';

/** Stable, machine-readable error codes (spec section 6.8). Clients branch on `code`, not on text. */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'BRANCH_ACCESS_DENIED'
  | 'MFA_REQUIRED'
  | 'NOT_FOUND'
  | 'CONCURRENT_MODIFICATION'
  | 'DUPLICATE_RESOURCE'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INTERNAL_ERROR';

export class AppError extends HttpException {
  constructor(
    status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly extensions?: Record<string, unknown>,
  ) {
    super(message, status);
  }
}
