import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const sendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required'),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required'),
  otp: z.preprocess(
    (val) => String(val ?? '').replace(/\D/g, '').slice(0, 6),
    z.string().length(6, 'Enter the 6-digit code from your email'),
  ),
});

/**
 * Maps Zod issues to a stable API shape for clients.
 */
export function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : 'root',
    message: issue.message,
  }));
}
