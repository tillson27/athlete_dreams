import { ApiError } from './api';
import { BRAND_CONTACT_EMAIL } from './brand';

// Maps a thrown auth error to one plain, user-facing sentence (never a raw
// payload or code — Context §11, client/AGENTS.md minimalism). Mapping is keyed
// on the auth kind because the same HTTP status carries different meaning per
// endpoint: a sign-up 409 means "account exists", while a 403 means the
// deployment is invite-gated.
export type AuthKind = 'sign-up' | 'sign-in';

// Public API contract: `linkToSignIn` is set only when the message invites the
// user to sign in instead (duplicate-account case), so the form can render the
// `/sign-in` link inline. Every other case is a bare sentence.
export type AuthErrorView = {
  message: string;
  linkToSignIn?: boolean;
};

const INVITE_ONLY_MESSAGE = `Access is currently invite-only. Contact ${BRAND_CONTACT_EMAIL}`;
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export function toAuthErrorView(kind: AuthKind, error: unknown): AuthErrorView {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return { message: INVITE_ONLY_MESSAGE };
    }
    if (kind === 'sign-up' && error.status === 409) {
      return {
        message: 'An account already exists for this email.',
        linkToSignIn: true,
      };
    }
    if (kind === 'sign-in' && error.status === 401) {
      return { message: 'Invalid email or password.' };
    }
  }
  if (kind === 'sign-in' && error instanceof Error && error.message) {
    return { message: error.message };
  }
  return { message: GENERIC_MESSAGE };
}
