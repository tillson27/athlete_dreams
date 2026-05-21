'use client';

import { useEffect, useState } from 'react';
import { Section, SectionHeading } from '@/components/site/Section';
import { AthleteCard } from '@/components/site/AthleteCard';
import { Badge } from '@/components/ui/Badge';
import { mockAthletes } from '@/lib/mockAthletes';
import { formatSport } from '@/lib/format';

const sports: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'All sports' },
  { key: 'RUNNING', label: 'Running' },
  { key: 'TRIATHLON', label: 'Triathlon' },
  { key: 'CYCLING', label: 'Cycling' },
  { key: 'CLIMBING', label: 'Climbing' },
  { key: 'SKIING', label: 'Skiing' },
];

function readSportFilter(): string {
  if (typeof window === 'undefined') return 'ALL';
  return new URLSearchParams(window.location.search).get('sport') ?? 'ALL';
}

export function AthleteDirectory() {
  const [sportFilter, setSportFilter] = useState('ALL');
  const filtered =
    sportFilter === 'ALL'
      ? mockAthletes
      : mockAthletes.filter((athlete) => athlete.primarySport === sportFilter);

  useEffect(() => {
    const updateSportFilter = () => setSportFilter(readSportFilter());
    updateSportFilter();
    window.addEventListener('popstate', updateSportFilter);
    return () => window.removeEventListener('popstate', updateSportFilter);
  }, []);

  return (
    <>
      <Section className="!pb-10">
        <SectionHeading
          eyebrow="Athlete directory"
          title="Pick a story. Fund a season."
          description="Every athlete here built their profile themselves. Filter by sport, browse the breakdowns, and back the campaigns that move you."
        />
        <div className="mt-8 flex flex-wrap gap-2">
          {sports.map((sport) => {
            const isActive = sportFilter === sport.key;
            return (
              <a
                key={sport.key}
                href={sport.key === 'ALL' ? './' : `?sport=${sport.key}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink text-paper'
                    : 'bg-paper-soft text-ink/75 hover:bg-ink/10'
                }`}
              >
                {sport.label}
              </a>
            );
          })}
        </div>
      </Section>

      <Section className="!pt-0">
        {filtered.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-ink/20 p-12 text-center">
            <Badge tone="soft">No matching athletes yet</Badge>
            <p className="mt-4 text-ink/70">
              We are still onboarding athletes in {formatSport(sportFilter)}. Check back soon - or
              forward FAD to someone who fits.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((athlete) => (
              <AthleteCard key={athlete.athleteSlug} athlete={athlete} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
