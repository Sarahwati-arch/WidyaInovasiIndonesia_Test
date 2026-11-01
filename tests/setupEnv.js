// Test environment variables. Set before application modules are loaded.
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/auth_portal_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'test_jwt_secret_must_be_at_least_32_characters_long_for_zod_validation';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ORIGIN = '*';
