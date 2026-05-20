import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './shared';

export const athleteEventSchema = z.object({
  athleteEventId: idSchema,
  athleteId: idSchema,
  eventName: z.string().min(1).max(200),
  eventLocation: z.string().max(200).nullable(),
  eventStartDate: z.string().date(),
  eventEndDate: z.string().date().nullable(),
  eventDescription: z.string().max(2000).nullable(),
  createdAt: isoDateTimeSchema,
});

export type AthleteEvent = z.infer<typeof athleteEventSchema>;

export const createAthleteEventRequestSchema = z
  .object({
    eventName: z.string().min(1).max(200),
    eventLocation: z.string().max(200).optional(),
    eventStartDate: z.string().date(),
    eventEndDate: z.string().date().optional(),
    eventDescription: z.string().max(2000).optional(),
  })
  .strict();

export type CreateAthleteEventRequest = z.infer<typeof createAthleteEventRequestSchema>;
