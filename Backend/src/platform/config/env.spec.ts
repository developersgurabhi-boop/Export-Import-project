import { parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
};

describe('parseEnv', () => {
  it('applies defaults for optional values', () => {
    const env = parseEnv({ ...valid });
    expect(env.PORT).toBe(3001);
    expect(env.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(env.NODE_ENV).toBe('development');
  });

  it('fails fast when the JWT secret is too short', () => {
    expect(() => parseEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('fails fast when DATABASE_URL is not a PostgreSQL URL', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
  });

  it('fails fast when a required variable is missing', () => {
    expect(() => parseEnv({ JWT_ACCESS_SECRET: 'a'.repeat(32) })).toThrow(/DATABASE_URL/);
  });
});
