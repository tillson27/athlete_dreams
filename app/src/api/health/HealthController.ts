import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { HealthRepository } from '../../repositories/HealthRepository';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { ServiceUnavailableError } from '../../shared/errors';

@injectable()
export class HealthController {
  constructor(private readonly healthRepository: HealthRepository) {}

  live = (_req: Request, res: Response): void => {
    ResponseHandler.success(res, 200, { status: 'live' });
  };

  ready = async (_req: Request, res: Response): Promise<void> => {
    try {
      await this.healthRepository.ping();
    } catch {
      throw new ServiceUnavailableError('Database is not reachable');
    }
    ResponseHandler.success(res, 200, { status: 'ready' });
  };
}
