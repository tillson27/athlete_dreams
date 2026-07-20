import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { createDonationRequestSchema } from 'fad-common';
import { DonationService } from './DonationService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody } from '../../shared/requestParsers';

@injectable()
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  // auth.optional: guests donate too; a signed-in supporter is attributed via
  // req.authenticatedUserId.
  create = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(createDonationRequestSchema, req);
    const result = await this.donationService.createDonation(body, req.authenticatedUserId);
    ResponseHandler.success(res, 201, result);
  };
}
