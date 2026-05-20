import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './shared';

export const userSchema = z.object({
  userId: idSchema,
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  avatarUrl: z.string().url().nullable(),
  emailVerifiedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;

export const updateUserRequestSchema = z
  .object({
    displayName: z.string().min(1).max(80).optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .strict();

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
