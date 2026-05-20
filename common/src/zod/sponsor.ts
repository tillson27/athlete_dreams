import { z } from 'zod';
import { idSchema, isoDateTimeSchema, slugSchema } from './shared';
import { SponsorshipStatus } from '../types/enums';

const sponsorshipStatusSchema = z.nativeEnum(SponsorshipStatus);

export const brandSchema = z.object({
  brandId: idSchema,
  brandSlug: slugSchema,
  brandName: z.string().min(1).max(160),
  brandWebsite: z.string().url().nullable(),
  brandLogoUrl: z.string().url().nullable(),
  brandBio: z.string().max(2000).nullable(),
  brandValues: z.array(z.string().max(40)),
  createdAt: isoDateTimeSchema,
});

export type Brand = z.infer<typeof brandSchema>;

export const sponsorshipInquirySchema = z.object({
  sponsorshipInquiryId: idSchema,
  brandId: idSchema,
  athleteId: idSchema,
  sponsorshipStatus: sponsorshipStatusSchema,
  inquiryMessage: z.string().max(4000),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type SponsorshipInquiry = z.infer<typeof sponsorshipInquirySchema>;

export const createSponsorshipInquiryRequestSchema = z
  .object({
    athleteId: idSchema,
    inquiryMessage: z.string().min(20).max(4000),
  })
  .strict();

export type CreateSponsorshipInquiryRequest = z.infer<typeof createSponsorshipInquiryRequestSchema>;
