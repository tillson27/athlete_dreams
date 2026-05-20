import { z } from 'zod';
import { idSchema, isoDateTimeSchema, moneyCentsSchema } from './shared';
import { DonationStatus } from '../types/enums';

const donationStatusSchema = z.nativeEnum(DonationStatus);

export const donationSchema = z.object({
  donationId: idSchema,
  campaignId: idSchema,
  supporterUserId: idSchema.nullable(),
  supporterDisplayName: z.string().max(120),
  supporterEmail: z.string().email().nullable(),
  donationAmountCents: moneyCentsSchema,
  donationMessage: z.string().max(400).nullable(),
  donationStatus: donationStatusSchema,
  isAnonymous: z.boolean(),
  createdAt: isoDateTimeSchema,
});

export type Donation = z.infer<typeof donationSchema>;

export const createDonationRequestSchema = z
  .object({
    campaignId: idSchema,
    supporterDisplayName: z.string().min(1).max(120),
    supporterEmail: z.string().email().optional(),
    donationAmountCents: z.number().int().positive(),
    donationMessage: z.string().max(400).optional(),
    isAnonymous: z.boolean().optional(),
  })
  .strict();

export type CreateDonationRequest = z.infer<typeof createDonationRequestSchema>;
