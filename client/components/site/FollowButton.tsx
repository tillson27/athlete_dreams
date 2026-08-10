'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFollows } from '@/lib/follows';
import { authHref } from '@/lib/authRedirect';
import { Icon } from '@/components/ui/Icon';

type Variant = 'hero' | 'block' | 'chip';

const base: Record<Variant, string> = {
  hero: 'inline-flex min-h-11 items-center gap-1.5 rounded-pill px-6 py-2 text-sm font-bold transition-all active:scale-95',
  block:
    'inline-flex w-full items-center justify-center gap-2 rounded-button py-3 text-sm font-bold shadow-md transition-all active:scale-95',
  chip: 'inline-flex min-h-11 items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold transition-all active:scale-95',
};

const followed: Record<Variant, string> = {
  hero: 'bg-white/15 text-white ring-1 ring-inset ring-white/40 hover:bg-white/25',
  block: 'border border-outline bg-surface-container-lowest text-on-surface hover:bg-surface-container',
  chip: 'border border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary',
};

const notFollowed: Record<Variant, string> = {
  hero: 'bg-white text-inverse-surface hover:bg-white/90',
  block: 'bg-primary-container text-on-primary hover:bg-primary',
  chip: 'bg-primary text-on-primary hover:bg-primary-strong',
};

export function FollowButton({
  slug,
  variant = 'chip',
  className,
}: {
  slug: string;
  variant?: Variant;
  className?: string;
}) {
  const { ready, isFollowing, toggle, requiresSignIn, error } = useFollows();
  const returnDestination = useCurrentReturnDestination('/athletes');
  const following = ready && isFollowing(slug);
  const label = following ? 'Following' : 'Follow';

  // Anonymous in api mode: the follow affordance invites sign-in instead of
  // silently writing to local storage (Context §11).
  if (requiresSignIn) {
    return (
      <Link
        href={authHref('/sign-in', returnDestination)}
        title="Sign in to follow"
        aria-label="Sign in to follow"
        className={`${base[variant]} ${notFollowed[variant]} ${className ?? ''}`}
      >
        <Icon name="person-add" className={variant === 'chip' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        Follow
      </Link>
    );
  }

  const button = (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => toggle(slug)}
      className={`${base[variant]} ${following ? followed[variant] : notFollowed[variant]} ${className ?? ''}`}
    >
      <Icon
        name={following ? 'check' : 'person-add'}
        className={variant === 'chip' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
      />
      {label}
    </button>
  );

  if (!error) return button;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {button}
      <span role="status" className="text-xs text-error">
        {error}
      </span>
    </span>
  );
}

function useCurrentReturnDestination(fallback: string): string {
  const [destination, setDestination] = useState(fallback);
  useEffect(() => {
    setDestination(`${window.location.pathname}${window.location.search}`);
  }, []);
  return destination;
}
