import {
  authSessionSchema,
  type AuthSession,
  type SignInRequest,
  type SignUpRequest,
} from 'fad-common';
import { apiFetch } from './client';

export async function signUpWithEmail(body: SignUpRequest): Promise<AuthSession> {
  return apiFetch('/v1/auth/sign-up', {
    method: 'POST',
    body,
    schema: authSessionSchema,
  });
}

export async function signInWithEmail(body: SignInRequest): Promise<AuthSession> {
  return apiFetch('/v1/auth/sign-in', {
    method: 'POST',
    body,
    schema: authSessionSchema,
  });
}
