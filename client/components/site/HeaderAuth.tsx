'use client';

import Link from 'next/link';
import { LinkButton } from '../ui/Button';
import { useSession } from '@/lib/prototype/session';

const mobileItemClass =
  'block px-5 py-3 text-base font-semibold text-on-surface hover:bg-surface-container';

export function HeaderAuth({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { session, ready } = useSession();
  const authed = ready && Boolean(session);

  if (variant === 'mobile') {
    if (authed) {
      return (
        <li>
          <Link href="/dashboard" className={mobileItemClass}>
            Dashboard
          </Link>
        </li>
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
      <LinkButton href="/dashboard" tone="primary" size="sm">
        Dashboard
      </LinkButton>
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
