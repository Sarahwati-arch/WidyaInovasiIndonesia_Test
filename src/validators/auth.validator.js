const { z } = require('zod');

// Email is trimmed and lowercased once here, so the rest of the code can trust it.
const email = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'));

const registerSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email,
  gender: z.enum(['male', 'female'], { error: 'Gender must be "male" or "female"' }),
  // bcrypt only reads the first 72 bytes, so longer passwords are rejected.
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email,
  password: z.string('Password is required').min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
