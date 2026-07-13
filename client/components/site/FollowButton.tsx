'use client';

import { useState } from 'react';
import { followAthlete, unfollowAthlete } from '@/lib/api/athletes';
import { useSession } from '@/lib/session';
import { Icon } from '@/components/ui/Icon';

type Variant = 'hero' | 'block' | 'chip';

const base: Record<Variant, string> = {
  hero: 'inline-flex min-h-10 items-center gap-1.5 rounded-pill px-6 py-2 text-sm font-bold transition-all active:scale-95',
  block:
    'inline-flex w-full items-center justify-center gap-2 rounded-button py-3 text-sm font-bold shadow-md transition-all active:scale-95',
  chip: 'inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 text-xs font-bold transition-all active:scale-95',
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
  initialIsFollowing = null,
}: {
  slug: string;
  variant?: Variant;
  className?: string;
  initialIsFollowing?: boolean | null;
}) {
  const { session, ready } = useSession();
  const [following, setFollowing] = useState(Boolean(initialIsFollowing));
  const [pending, setPending] = useState(false);
  const label = following ? 'Following' : 'Follow';

  const toggleFollow = async () => {
    if (!ready || pending) return;
    if (!session?.accessToken) {
      window.location.href = '/sign-in';
      return;
    }

    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setPending(true);
    try {
      const result = nextFollowing
        ? await followAthlete(slug, session.accessToken)
        : await unfollowAthlete(slug, session.accessToken);
      setFollowing(result.isFollowing);
    } catch {
      setFollowing(!nextFollowing);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={following}
      disabled={!ready || pending}
      onClick={toggleFollow}
      className={`${base[variant]} ${following ? followed[variant] : notFollowed[variant]} ${className ?? ''}`}
    >
      <Icon
        name={following ? 'check' : 'person-add'}
        className={variant === 'chip' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
      />
      {label}
    </button>
  );
}
