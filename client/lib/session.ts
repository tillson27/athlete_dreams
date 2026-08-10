'use client';

import { useEffect, useState } from 'react';
import type { User } from 'fad-common';
import { createBrowserStore } from './browserStore';
import { DATA_SOURCE } from './dataSource';
import {
  fetchMe,
  setAuthTokenProvider,
  setOnUnauthorized,
  signIn as apiSignIn,
  signUp as apiSignUp,
} from './api';

export type Session = {
  name: string;
  email: string;
  published: boolean;
  mustVerifyEmail: boolean;
};

export type AuthResult = {
  mustVerifyEmail: boolean;
};

const sessionStore = createBrowserStore<Session>('arc-session', 'arc-session-change');
const mockAccountStore = createBrowserStore<{ name: string; email: string }>(
  'arc-mock-account',
  'arc-mock-account-change',
);
const onboardingNameStore = createBrowserStore<{ name?: string } & Record<string, unknown>>(
  'arc-onboarding-profile',
  'arc-onboarding-profile-change',
);

function seedOnboardingName(name: string) {
  const profile = onboardingNameStore.read() ?? {};
  if (!profile.name) {
    onboardingNameStore.write({ ...profile, name });
  }
}

// --- API mode ---

type AuthRecord = {
  accessToken: string;
  user: User;
  published: boolean;
};

const authStore = createBrowserStore<AuthRecord>('arc-auth', 'arc-auth-change');

// Wire the persisted token into the authed `api.ts` helpers and clear the session
// whenever an authed request returns 401 (stale/expired token). Registered at
// module load so the seam is live before any component mounts.
setAuthTokenProvider(() => authStore.read()?.accessToken ?? null);
setOnUnauthorized(() => authStore.write(null));

function authRecordToSession(record: AuthRecord | null): Session | null {
  if (!record) return null;
  return {
    name: record.user.displayName,
    email: record.user.email,
    published: record.published,
    mustVerifyEmail: !record.user.emailVerifiedAt,
  };
}

// --- Public surface (mode-branched internally) ---

export async function signUp({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password?: string;
}): Promise<AuthResult> {
  if (DATA_SOURCE === 'api') {
    const session = await apiSignUp({ email, password: password ?? '', displayName: name });
    authStore.write({ accessToken: session.accessToken, user: session.user, published: false });
    return { mustVerifyEmail: session.mustVerifyEmail };
  }
  mockAccountStore.write({ name, email });
  sessionStore.write({ name, email, published: false, mustVerifyEmail: false });
  seedOnboardingName(name);
  return { mustVerifyEmail: false };
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password?: string;
}): Promise<AuthResult> {
  if (DATA_SOURCE === 'api') {
    const session = await apiSignIn({ email, password: password ?? '' });
    authStore.write({ accessToken: session.accessToken, user: session.user, published: false });
    return { mustVerifyEmail: session.mustVerifyEmail };
  }
  const account = mockAccountStore.read();
  if (!account || account.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('No account found for this email.');
  }
  sessionStore.write({
    name: account.name,
    email: account.email,
    published: false,
    mustVerifyEmail: false,
  });
  return { mustVerifyEmail: false };
}

export function signOut() {
  if (DATA_SOURCE === 'api') {
    authStore.write(null);
    return;
  }
  sessionStore.write(null);
}

// In api mode the real publish state lives on the profile; this reflects a
// just-completed publish into the session hint (dashboard/editor refresh the
// authoritative state from `GET /v1/athletes/me`).
export function markPublished() {
  if (DATA_SOURCE === 'api') {
    const record = authStore.read();
    if (record) authStore.write({ ...record, published: true });
    return;
  }
  const existing = sessionStore.read();
  sessionStore.write({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    published: true,
    mustVerifyEmail: false,
  });
}

export async function refreshSessionUser(): Promise<void> {
  if (DATA_SOURCE !== 'api') return;
  const record = authStore.read();
  if (!record) return;
  const user = await fetchMe();
  const current = authStore.read();
  if (current) authStore.write({ ...current, user });
}

/** SSR-safe: returns { session: null, ready: false } until mounted on the client. */
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (DATA_SOURCE === 'api') {
      const sync = () => setSession(authRecordToSession(authStore.read()));
      sync();
      setReady(true);

      // Validate the persisted token on mount: refresh the stored user on success;
      // a 401 self-clears via the registered unauthorized listener, and any other
      // failure (revoked/expired) clears the stale record too.
      const record = authStore.read();
      if (record) {
        refreshSessionUser()
          .catch(() => {
            authStore.write(null);
          });
      }

      return authStore.subscribe(sync);
    }

    const sync = () => setSession(sessionStore.read());
    sync();
    setReady(true);
    return sessionStore.subscribe(sync);
  }, []);

  return { session, ready };
}
