import { z } from 'zod';
import { userSchema } from './user';

export const signUpRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(200),
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

export const authSessionSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;
