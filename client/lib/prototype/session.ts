'use client';

import { useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';
import { seedPrototypeOnboardingName } from './onboarding';

// TODO: Replace this prototype session adapter with backend auth in Step 10.
export type Session = {
  name: string;
  email: string;
  published: boolean;
};

const sessionStore = createBrowserStore<Session>('arc-session', 'arc-session-change');

export function signUp({ name, email }: { name: string; email: string }) {
  sessionStore.write({ name, email, published: false });
  seedPrototypeOnboardingName(name);
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

// Public API contract: returns { session: null, ready: false } until mounted on the client.
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
