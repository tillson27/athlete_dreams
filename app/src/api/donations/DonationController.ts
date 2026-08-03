import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { createDonationRequestSchema } from 'fad-common';
import { DonationService } from './DonationService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody } from '../../shared/requestParsers';
import { PostHogService } from '../../services/infrastructure/PostHogService';

@injectable()
export class DonationController {
  constructor(
    private readonly donationService: DonationService,
    private readonly posthog: PostHogService
  ) {}

  // auth.optional: guests donate too; a signed-in supporter is attributed via
  // req.authenticatedUserId.
  create = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(createDonationRequestSchema, req);
    const result = await this.donationService.createDonation(body, req.authenticatedUserId);
    // Use authenticated user id when available; fall back to a deterministic
    // donation-scoped id so the event is never sent without a distinct id.
    const distinctId = req.authenticatedUserId ?? `donation:${result.donation.donationId}`;
    this.posthog.capture({
      distinctId,
      event: 'donation_initiated',
      properties: {
        donation_id: result.donation.donationId,
        campaign_id: result.donation.campaignId,
        amount_cents: result.donation.donationAmountCents,
        is_anonymous: result.donation.isAnonymous,
        is_authenticated: Boolean(req.authenticatedUserId),
      },
    });
    ResponseHandler.success(res, 201, result);
  };
}
