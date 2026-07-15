import { z } from 'zod';

export const idSchema = z.string().uuid();
export const isoDateTimeSchema = z.string().datetime();
export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only');

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export const moneyCentsSchema = z.number().int().nonnegative();

// Public API contract: a media reference is an absolute http(s) URL, a persisted
// data-image ref for the no-storage MVP path, or a bare storage/photo ref.
// The seed and DB carry bare refs for gallery/feed photos; clients compose a display
// URL from a bare ref (see `client/lib/unsplash.ts`). Kept permissive so real API
// responses validate without forcing a URL rewrite at the API boundary.
export const mediaRefSchema = z
  .string()
  .min(1)
  .max(1_250_000)
  .refine(
    (value) =>
      /^https?:\/\//.test(value) ||
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ||
      /^[A-Za-z0-9._-]+$/.test(value),
    'Must be an absolute http(s) URL, a persisted data image, or a bare media reference'
  );

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
