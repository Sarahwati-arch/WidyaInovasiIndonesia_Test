require('dotenv').config({ quiet: true });
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast: the app should not start with a broken configuration.
  const problems = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

module.exports = Object.freeze(parsed.data);
