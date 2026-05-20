import type { Response } from 'express';

export class ResponseHandler {
  static success<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ data });
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }
}
