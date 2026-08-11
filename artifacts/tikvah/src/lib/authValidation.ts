import { z } from 'zod';

// Supabase Auth owns account creation/login now, so these forms no longer
// correspond to a generated backend schema (see @workspace/api-zod) — this is
// the client-side validation the old generated LoginUserBody/RegisterUserBody
// etc. used to provide, kept as plain zod schemas for the same UX.
//
// Password length is enforced here for UX only. The *actual* enforcement
// point moved to Supabase Auth's own password policy (Project Settings →
// Auth → Password Requirements in the dashboard) — set its minimum length to
// match (10) so a request that bypasses this form can't set a weaker one.

export const emailSchema = z.string().email('Please enter a valid email address.');
export const passwordSchema = z.string().min(10, 'At least 10 characters.').max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password.'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Please share your name.').max(120),
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
