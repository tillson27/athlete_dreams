'use client';

import { useEffect, useState } from 'react';

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

const SESSION_KEY = 'arc-session';
const ONBOARDING_KEY = 'arc-onboarding-profile';
const SESSION_EVENT = 'arc-session-change';

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch {
    /* storage unavailable — mock session simply won't persist */
  }
}

function seedOnboardingName(name: string) {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    const profile = raw ? JSON.parse(raw) : {};
    if (!profile.name) {
      window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...profile, name }));
    }
  } catch {
    /* storage unavailable — name simply won't pre-fill */
  }
}

export function signUp({ name, email }: { name: string; email: string }) {
  writeSession({ name, email, published: false });
  seedOnboardingName(name);
}

export function signIn({ email }: { email: string }) {
  const existing = readSession();
  writeSession({
    name: existing?.name ?? '',
    email,
    published: existing?.published ?? false,
  });
}

export function signOut() {
  writeSession(null);
}

export function markPublished() {
  const existing = readSession();
  writeSession({
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
    const sync = () => setSession(readSession());
    sync();
    setReady(true);
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { session, ready };
}
