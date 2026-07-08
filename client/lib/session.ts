'use client';

import { useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';

/**
 * Frontend-only mock session. No backend, no auth, no password storage —
 * this exists so the sign-up → onboard → publish → dashboard loop feels real
 * in the prototype. Profile *content* lives in the onboarding store
 * (`arc-onboarding-profile`); this only tracks who is "signed in".
 */
export type Session = {
  name: string;
  email: string;
  published: boolean;
};

const sessionStore = createBrowserStore<Session>('arc-session', 'arc-session-change');
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

export function signUp({ name, email }: { name: string; email: string }) {
  sessionStore.write({ name, email, published: false });
  seedOnboardingName(name);
}

export function signIn({ email }: { email: string }) {
  const existing = sessionStore.read();
  sessionStore.write({
    name: existing?.name ?? '',
    email,
    published: existing?.published ?? false,
  });
}

export function signOut() {
  sessionStore.write(null);
}

export function markPublished() {
  const existing = sessionStore.read();
  sessionStore.write({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    published: true,
  });
}

/** SSR-safe: returns { session: null, ready: false } until mounted on the client. */
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(sessionStore.read());
    sync();
    setReady(true);
    return sessionStore.subscribe(sync);
  }, []);

  return { session, ready };
}
