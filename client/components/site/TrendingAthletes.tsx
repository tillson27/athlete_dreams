'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export type TrendingAthlete = {
  name: string;
  sport: string;
  image: string;
  highlight: string;
  followers: string;
  href: string;
};

export function TrendingAthletes({ athletes }: { athletes: TrendingAthlete[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    railRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto mb-12 flex w-full max-w-[var(--spacing-container-max)] items-end justify-between px-5 md:px-16">
        <div>
          <h3 className="font-display text-3xl font-bold text-on-surface md:text-4xl">
            Trending Athletes
          </h3>
          <p className="mt-2 text-on-surface-variant">
            Profiles gaining significant momentum this week.
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-400)}
            className="rounded-full border border-outline-variant p-2 transition-colors hover:bg-surface-container"
          >
            <Chevron className="h-6 w-6 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(400)}
            className="rounded-full border border-outline-variant p-2 transition-colors hover:bg-surface-container"
          >
            <Chevron className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex gap-6 overflow-x-auto px-5 pb-10 md:px-16"
      >
        {athletes.map((athlete) => (
          <Link
            key={athlete.name}
            href={athlete.href}
            className="group min-w-[256px] overflow-hidden rounded-card bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.04)] transition-transform hover:scale-[1.02] md:min-w-[304px]"
          >
            <div className="relative h-64 bg-surface-container">
              <Image
                src={athlete.image}
                alt={athlete.name}
                fill
                sizes="380px"
                className="object-cover"
              />
            </div>
            <div className="p-8">
              <div className="mb-4">
                <h4 className="font-display text-2xl font-bold text-on-surface">
                  {athlete.name}
                </h4>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  {athlete.sport}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 rounded-lg bg-surface-container-low px-3 py-2.5">
                  <Icon name="medal" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="label-bold text-on-surface">{athlete.highlight}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-sm text-on-surface-variant">
                  <PeopleIcon className="h-4 w-4 shrink-0" />
                  <span>
                    <strong className="text-on-surface">{athlete.followers}</strong> followers
                  </span>
                  <span className="text-on-surface-variant/40">•</span>
                  <span className="label-bold text-secondary">Trending this week</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-6 1.3-6 4v2h12v-2c0-2.7-3.3-4-6-4Zm8 0c-.4 0-.9 0-1.3.1 1.4.9 2.3 2.1 2.3 3.9v2h5v-2c0-2.7-3.3-4-6-4Z" />
    </svg>
  );
}
