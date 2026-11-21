/**
 * Permission catalogue (spec section 9, "Permissions"). Codes use `<resource>:<action>`.
 * Adding a permission here is the only place it is defined; the seed syncs it to the database.
 */
const MASTER_RESOURCES = ['party', 'vehicle', 'driver', 'transporter', 'master'] as const;
const MASTER_ACTIONS = ['read', 'create', 'update'] as const;

export const PERMISSION_CODES = [
  'org:manage',
  'user:manage',
  ...MASTER_RESOURCES.flatMap((resource) => MASTER_ACTIONS.map((action) => `${resource}:${action}`)),
  'rate:read',
  'rate:manage',
  'lr:read',
  'lr:create',
  'lr:update',
  'lr:book',
  'lr:cancel',
  'lr:deliver',
  'lr:override_rate',
  'eway:read',
  'eway:generate',
  'eway:update',
  'eway:cancel',
  'eway:manage',
  'challan:read',
  'challan:create',
  'challan:update',
  'challan:dispatch',
  'invoice:read',
  'invoice:create',
  'invoice:issue',
  'invoice:cancel',
  'invoice:adjust',
  'payment:read',
  'payment:record',
  'payment:reverse',
  'report:operational',
  'report:financial',
  'report:export',
  'dashboard:read',
  'audit:read',
  'ops:read',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

/**
 * Permissions that additionally require an MFA-verified session (token claim mfa=true).
 * Spec section 6.3. Enforced now; becomes usable once TOTP MFA is implemented.
 */
export const MFA_REQUIRED_PERMISSIONS: ReadonlySet<PermissionCode> = new Set<PermissionCode>([
  'user:manage',
  'org:manage',
  'eway:cancel',
  'invoice:cancel',
  'payment:reverse',
  'report:financial',
]);

export function describePermission(code: PermissionCode): string {
  const [resource, action] = code.split(':');
  return `${action.replace(/_/g, ' ')} ${resource}`;
}
