// Loaded by Jest before every test file. Unit tests never connect to a database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.JWT_ACCESS_SECRET = 'unit-test-secret-that-is-at-least-32-characters-long';
process.env.JWT_ACCESS_TTL_SECONDS = '900';
process.env.CORS_ORIGINS = 'http://localhost:5173';
