const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters') // bcrypt ignores bytes past 72
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
