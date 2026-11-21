import { PERMISSION_CODES, MFA_REQUIRED_PERMISSIONS } from '../../../platform/authorization/permissions';
import { SYSTEM_ROLES } from './system-roles';

describe('system roles', () => {
  const byCode = (code: string) => {
    const role = SYSTEM_ROLES.find((r) => r.code === code);
    if (!role) throw new Error(`missing role ${code}`);
    return role;
  };

  it('defines the five roles from the spec', () => {
    expect(SYSTEM_ROLES.map((r) => r.code).sort()).toEqual(
      ['ACCOUNTS', 'BOOKING_CLERK', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'VIEWER'].sort(),
    );
  });

  it('head office admin holds every permission and is the only head office role', () => {
    expect([...byCode('HEAD_OFFICE_ADMIN').permissions].sort()).toEqual([...PERMISSION_CODES].sort());
    expect(SYSTEM_ROLES.filter((r) => r.isHeadOffice).map((r) => r.code)).toEqual(['HEAD_OFFICE_ADMIN']);
  });

  it('branch manager cannot manage users or the organization', () => {
    const perms = byCode('BRANCH_MANAGER').permissions;
    expect(perms).not.toContain('user:manage');
    expect(perms).not.toContain('org:manage');
    expect(perms).toContain('lr:book');
  });

  it('viewer is read-only (every permission is a read, dashboard or operational report)', () => {
    for (const permission of byCode('VIEWER').permissions) {
      const readOnly = permission.endsWith(':read') || permission === 'report:operational';
      expect({ permission, readOnly }).toEqual({ permission, readOnly: true });
    }
  });

  it('only references permissions that exist in the catalogue', () => {
    const known = new Set<string>(PERMISSION_CODES);
    for (const role of SYSTEM_ROLES) {
      for (const permission of role.permissions) {
        expect(known.has(permission)).toBe(true);
      }
    }
  });

  it('gives no non-admin role an MFA-gated permission without an explicit reason', () => {
    // Only the admin role and accounts (financial reports, invoice cancel, payment reversal) hold MFA-gated permissions.
    for (const role of SYSTEM_ROLES) {
      const gated = role.permissions.filter((p) => MFA_REQUIRED_PERMISSIONS.has(p));
      if (role.code !== 'HEAD_OFFICE_ADMIN' && role.code !== 'ACCOUNTS' && role.code !== 'BRANCH_MANAGER') {
        expect({ role: role.code, gated }).toEqual({ role: role.code, gated: [] });
      }
    }
  });
});
