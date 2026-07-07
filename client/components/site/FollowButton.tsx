'use client';

import { useFollows } from '@/lib/follows';

type Variant = 'hero' | 'block' | 'chip';

const base: Record<Variant, string> = {
  hero: 'inline-flex min-h-10 items-center gap-1.5 rounded-pill px-6 py-2 text-sm font-bold tracking-[0.05em] transition-all active:scale-95',
  block:
    'inline-flex w-full items-center justify-center gap-2 rounded-button py-3 text-sm font-bold tracking-[0.05em] shadow-md transition-all active:scale-95',
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
  chip: 'bg-primary text-on-primary hover:bg-[#832700]',
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
  const { ready, isFollowing, toggle } = useFollows();
  const following = ready && isFollowing(slug);
  const label = following ? 'Following' : 'Follow';

  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => toggle(slug)}
      className={`${base[variant]} ${following ? followed[variant] : notFollowed[variant]} ${className ?? ''}`}
    >
      {following ? (
        <CheckIcon className={variant === 'chip' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : (
        <AddIcon className={variant === 'chip' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      {label}
    </button>
  );
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h12v-1c0-2.8 0-5-4-5Zm9-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}
