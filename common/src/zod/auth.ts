import { z } from 'zod';
import { userSchema } from './user';

export const strongPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(200)
  .refine((value) => /[A-Za-z]/.test(value), 'Password must include a letter.')
  .refine((value) => /\d/.test(value), 'Password must include a number.');

export const signUpRequestSchema = z
  .object({
    email: z.string().email(),
    password: strongPasswordSchema,
    displayName: z.string().min(1).max(80),
  })
  .strict();

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export const signInRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).max(200),
  })
  .strict();

export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const forgotPasswordRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().min(20),
    password: strongPasswordSchema,
  })
  .strict();

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const verifyEmailRequestSchema = z
  .object({
    token: z.string().min(20),
  })
  .strict();

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const resendVerificationRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ResendVerificationRequest = z.infer<typeof resendVerificationRequestSchema>;

export const authSessionSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;
