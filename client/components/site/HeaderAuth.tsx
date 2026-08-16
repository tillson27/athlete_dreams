'use client';

import Link from 'next/link';
import { LinkButton } from '../ui/Button';
import { signOut, useSession } from '@/lib/session';

const mobileItemClass =
  'block px-5 py-3 text-base font-semibold text-on-surface hover:bg-surface-container';

export function HeaderAuth({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { session, ready } = useSession();
  const authed = ready && Boolean(session);

  if (variant === 'mobile') {
    if (authed) {
      return (
        <>
          {session?.isAdmin ? (
            <li>
              <Link href="/admin" className={mobileItemClass}>
                Admin
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/dashboard" className={mobileItemClass}>
              Dashboard
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={signOut}
              className={`${mobileItemClass} w-full text-left text-error`}
            >
              Sign out
            </button>
          </li>
        </>
      );
    }
    return (
      <>
        <li>
          <Link href="/sign-in" className={mobileItemClass}>
            Sign In
          </Link>
        </li>
        <li>
          <Link href="/sign-up" className={mobileItemClass}>
            Start your story
          </Link>
        </li>
      </>
    );
  }

  if (authed) {
    return (
      <>
        {session?.isAdmin ? (
          <LinkButton href="/admin" tone="secondary" size="sm">
            Admin
          </LinkButton>
        ) : null}
        <LinkButton href="/dashboard" tone="primary" size="sm">
          Dashboard
        </LinkButton>
        <button
          type="button"
          onClick={signOut}
          className="label-bold rounded-pill px-3 py-2 text-on-surface-variant transition-colors hover:text-error"
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        className="hidden label-bold rounded-pill px-3 py-2 text-on-surface-variant hover:text-primary md:inline-flex"
      >
        Sign In
      </Link>
      <LinkButton href="/sign-up" tone="primary" size="sm">
        Start your story
      </LinkButton>
    </>
  );
}
