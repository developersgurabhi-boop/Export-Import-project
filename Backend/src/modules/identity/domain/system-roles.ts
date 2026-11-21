import { PERMISSION_CODES, type PermissionCode } from '../../../platform/authorization/permissions';

export interface SystemRoleDefinition {
  code: string;
  name: string;
  /** Head office roles see every branch regardless of assignments. */
  isHeadOffice: boolean;
  permissions: readonly PermissionCode[];
}

const BRANCH_MANAGER_EXCLUDED: readonly PermissionCode[] = ['org:manage', 'user:manage'];
const VIEWER_EXCLUDED: readonly PermissionCode[] = ['audit:read', 'ops:read'];

/**
 * Seeded roles (spec 9, "Roles"). Permission sets are the default; the business owner
 * may adjust them later through the roles API. Judgement calls are noted inline.
 */
export const SYSTEM_ROLES: readonly SystemRoleDefinition[] = [
  {
    code: 'HEAD_OFFICE_ADMIN',
    name: 'Head office admin',
    isHeadOffice: true,
    permissions: PERMISSION_CODES,
  },
  {
    // "operational + billing in assigned branches, no user/org management".
    // Judgement: everything except org/user management, so rates and reports stay available.
    code: 'BRANCH_MANAGER',
    name: 'Branch manager',
    isHeadOffice: false,
    permissions: PERMISSION_CODES.filter((p) => !BRANCH_MANAGER_EXCLUDED.includes(p)),
  },
  {
    code: 'BOOKING_CLERK',
    name: 'Booking clerk',
    isHeadOffice: false,
    permissions: [
      'party:read',
      'party:create',
      'lr:read',
      'lr:create',
      'lr:update',
      'lr:book',
      'eway:read',
      'eway:generate',
      'challan:read',
      'challan:create',
      'challan:update',
      'dashboard:read',
    ],
  },
  {
    code: 'ACCOUNTS',
    name: 'Accounts',
    isHeadOffice: false,
    permissions: [
      'invoice:read',
      'invoice:create',
      'invoice:issue',
      'invoice:cancel',
      'invoice:adjust',
      'payment:read',
      'payment:record',
      'payment:reverse',
      'report:financial',
      'report:export',
      'party:read',
      'lr:read',
    ],
  },
  {
    code: 'VIEWER',
    name: 'Viewer',
    isHeadOffice: false,
    // Judgement: every read permission except audit and ops, plus operational reports.
    permissions: [
      ...PERMISSION_CODES.filter((p) => p.endsWith(':read') && !VIEWER_EXCLUDED.includes(p)),
      'report:operational',
    ],
  },
];
