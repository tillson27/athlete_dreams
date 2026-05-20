import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import { signInRequestSchema, signUpRequestSchema } from 'fad-common';
import { AuthService } from './AuthService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody } from '../../shared/requestParsers';

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signUp = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(signUpRequestSchema, req);
    const session = await this.authService.signUp(body);
    ResponseHandler.success(res, 201, session);
  };

  signIn = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(signInRequestSchema, req);
    const session = await this.authService.signIn(body);
    ResponseHandler.success(res, 200, session);
  };
}
