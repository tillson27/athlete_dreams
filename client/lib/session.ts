'use client';

import { useEffect, useState } from 'react';
import type { AuthSession, SignInRequest, SignUpRequest } from 'fad-common';
import { signInWithEmail, signUpWithEmail } from './api/auth';
import { upsertMyDraft } from './api/athletes';
import { isApiError } from './api/client';
import { createBrowserStore } from './browserStore';
import { slugifyName } from './slugify';

export type Session = AuthSession & {
  userId: string;
  name: string;
  email: string;
};

const sessionStore = createBrowserStore<AuthSession>('arc-auth-session', 'arc-auth-session-change');

export async function signUp(input: SignUpRequest): Promise<Session> {
  const session = await signUpWithEmail(input);
  persistSession(session);
  await seedAthleteDraft(session, input.displayName);
  return toSession(session);
}

export async function signIn(input: SignInRequest): Promise<Session> {
  const session = await signInWithEmail(input);
  persistSession(session);
  return toSession(session);
}

export function signOut(): void {
  sessionStore.write(null);
}

export function readSessionAccessToken(): string | null {
  return readValidSession()?.accessToken ?? null;
}

export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readValidSession());
    sync();
    setReady(true);
    return sessionStore.subscribe(sync);
  }, []);

  useEffect(() => {
    if (!session) return;
    const expiresInMs = new Date(session.accessTokenExpiresAt).getTime() - Date.now();
    if (expiresInMs <= 0) {
      signOut();
      return;
    }
    const timer = window.setTimeout(signOut, expiresInMs);
    return () => window.clearTimeout(timer);
  }, [session]);

  return { session, ready };
}

function persistSession(session: AuthSession): void {
  sessionStore.write(session);
}

function readValidSession(): Session | null {
  const session = sessionStore.read();
  if (!session) return null;
  if (new Date(session.accessTokenExpiresAt).getTime() <= Date.now()) {
    sessionStore.write(null);
    return null;
  }
  return toSession(session);
}

function toSession(session: AuthSession): Session {
  return {
    ...session,
    userId: session.user.userId,
    name: session.user.displayName,
    email: session.user.email,
  };
}

async function seedAthleteDraft(session: AuthSession, displayName: string): Promise<void> {
  const athleteSlug = slugifyName(displayName) || null;
  try {
    await upsertMyDraft(session.accessToken, {
      athleteSlug,
      fullName: displayName,
    });
  } catch (error) {
    if (!isApiError(error) || error.status !== 409 || !athleteSlug) throw error;
    await upsertMyDraft(session.accessToken, {
      fullName: displayName,
    });
  }
}
