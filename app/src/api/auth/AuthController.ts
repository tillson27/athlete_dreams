import { injectable } from 'tsyringe';
import type { Request, Response } from 'express';
import {
  type AuthActionResponse,
  forgotPasswordRequestSchema,
  resendVerificationRequestSchema,
  resetPasswordRequestSchema,
  signInRequestSchema,
  signUpRequestSchema,
  verifyEmailRequestSchema,
} from 'fad-common';
import { AuthService } from './AuthService';
import { ResponseHandler } from '../../shared/ResponseHandler';
import { parseRequestBody } from '../../shared/requestParsers';

const AUTH_ACTION_RESPONSE = { ok: true } satisfies AuthActionResponse;

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

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(forgotPasswordRequestSchema, req);
    await this.authService.forgotPassword(body);
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(resetPasswordRequestSchema, req);
    await this.authService.resetPassword(body);
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(verifyEmailRequestSchema, req);
    await this.authService.verifyEmail(body);
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    const body = parseRequestBody(resendVerificationRequestSchema, req);
    await this.authService.resendVerification(body);
    ResponseHandler.success(res, 200, AUTH_ACTION_RESPONSE);
  };
}
