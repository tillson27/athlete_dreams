'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCents } from '@/lib/format';
import { VerifiedChip } from '@/components/ui/Badge';

export type TrendingAthlete = {
  name: string;
  sport: string;
  image: string;
  percent: number;
  raisedCents: number;
  backers: number;
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
            <div className="relative h-64">
              <Image
                src={athlete.image}
                alt={athlete.name}
                fill
                sizes="380px"
                className="object-cover"
              />
              <div className="absolute right-4 top-4">
                <VerifiedChip />
              </div>
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
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label-bold text-on-surface-variant">Funding Goal</span>
                    <span className="label-bold text-primary">{athlete.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-container">
                    <div
                      className="progress-gradient h-full"
                      style={{ width: `${athlete.percent}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="label-bold text-on-surface-variant">Raised</p>
                    <p className="font-display text-xl font-bold text-on-surface">
                      {formatCents(athlete.raisedCents)}
                    </p>
                  </div>
                  <div>
                    <p className="label-bold text-on-surface-variant">Backers</p>
                    <p className="font-display text-xl font-bold text-on-surface">
                      {athlete.backers}
                    </p>
                  </div>
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
