import { Router, type RequestHandler } from 'express';

export abstract class BaseRouterFactory {
  abstract readonly basePath: string;

  protected wrap(handler: (...args: Parameters<RequestHandler>) => Promise<void> | void): RequestHandler {
    return (req, res, next) => {
      Promise.resolve(handler(req, res, next)).catch(next);
    };
  }

  abstract build(): Router;
}
