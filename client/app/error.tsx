'use client';

import Link from 'next/link';
import { BRAND_CONTACT_EMAIL } from '@/lib/brand';

// Root error boundary — replaces Next's default error screen with a branded
// recovery page. `reset` re-renders the segment that threw.
export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <p className="label-bold text-primary">Something went wrong</p>
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        We tripped, but we&rsquo;re back up.
      </h1>
      <p className="max-w-md text-base text-on-surface-variant">
        An unexpected error interrupted the page. Try again — and if it keeps happening, email{' '}
        <a className="font-semibold text-primary underline" href={`mailto:${BRAND_CONTACT_EMAIL}`}>
          {BRAND_CONTACT_EMAIL}
        </a>
        .
      </p>
      {error.digest ? (
        <p className="text-xs text-on-surface-variant/60">Error reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="label-bold rounded-button bg-primary px-6 py-3 text-on-primary transition-colors hover:bg-primary-strong"
        >
          Try again
        </button>
        <Link href="/" className="label-bold text-on-surface hover:text-primary">
          Back to home &rarr;
        </Link>
      </div>
    </div>
  );
}
