import { z } from 'zod';

const lowerEmail = z.email().max(320).transform((value) => value.trim().toLowerCase());

export const loginSchema = z.strictObject({
  email: lowerEmail,
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const assignmentSchema = z.strictObject({
  branchId: z.uuid(),
  roleCode: z.string().min(1).max(64),
});
export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const createUserSchema = z.strictObject({
  email: lowerEmail,
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(12, 'Password must be at least 12 characters').max(256),
  assignments: z.array(assignmentSchema).min(1).max(50),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** `version` is required on every update; a mismatch returns 409 CONCURRENT_MODIFICATION. */
export const updateUserSchema = z.strictObject({
  version: z.number().int().min(1),
  fullName: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  assignments: z.array(assignmentSchema).min(1).max(50).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.uuid().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const idParamSchema = z.uuid();
