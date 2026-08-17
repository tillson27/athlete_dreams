'use client';

import Link from 'next/link';

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-pill px-4 py-1.5 text-sm font-bold transition-colors ${
        active ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyFollowing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center sm:p-10">
      <h3 className="font-display text-xl font-bold text-on-surface">
        You&rsquo;re not following anyone yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-on-surface-variant">
        Follow runners to build your feed — their results and upcoming races show up here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/athletes"
          className="label-bold rounded-button bg-primary px-6 py-3 text-on-primary transition-colors hover:bg-primary-strong"
        >
          Discover runners
        </Link>
        {!signedIn ? (
          <Link
            href="/sign-in"
            className="label-bold rounded-button border-2 border-outline px-6 py-3 text-on-surface transition-colors hover:bg-surface-container"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </div>
  );
}
