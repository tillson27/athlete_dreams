'use client';

import { useEffect, useMemo, useState } from 'react';
import { AthleteRow } from '@/components/site/AthleteCard';
import { LinkButton, Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockAthletes, type MockAthlete } from '@/lib/mockAthletes';

const SPORTS: Array<{ key: MockAthlete['primarySport'] | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Sports' },
  { key: 'RUNNING', label: 'Running' },
  { key: 'TRIATHLON', label: 'Triathlon' },
  { key: 'CYCLING', label: 'Cycling' },
  { key: 'CLIMBING', label: 'Climbing' },
  { key: 'SKIING', label: 'Skiing' },
  { key: 'TRACK_AND_FIELD', label: 'Track & Field' },
  { key: 'SWIMMING', label: 'Swimming' },
];

const COUNTRIES: Array<{ code: MockAthlete['countryCode'] | 'ALL'; label: string }> = [
  { code: 'ALL', label: 'Anywhere' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'United States' },
];

const STAGES = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'LIVE', label: 'Live Funding' },
  { key: 'CLOSING', label: 'Closing Soon' },
  { key: 'NEW', label: 'Newly Onboarded' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

type Filters = {
  sport: MockAthlete['primarySport'] | 'ALL';
  country: MockAthlete['countryCode'] | 'ALL';
  stage: StageKey;
  search: string;
};

const initialFilters: Filters = {
  sport: 'ALL',
  country: 'ALL',
  stage: 'ALL',
  search: '',
};

export function AthleteDirectory() {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Sync initial state from URL (?sport=RUNNING etc.) for deep-linkability.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setFilters((current) => ({
      ...current,
      sport: (params.get('sport') as Filters['sport']) ?? current.sport,
      country: (params.get('country') as Filters['country']) ?? current.country,
    }));
  }, []);

  const filtered = useMemo(() => {
    return mockAthletes.filter((athlete) => {
      if (filters.sport !== 'ALL' && athlete.primarySport !== filters.sport) return false;
      if (filters.country !== 'ALL' && athlete.countryCode !== filters.country) return false;
      if (filters.stage === 'LIVE' && athlete.activeCampaignCount === 0) return false;
      if (filters.search) {
        const needle = filters.search.toLowerCase();
        const hay = `${athlete.fullName} ${athlete.hometown} ${athlete.primarySport}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [filters]);

  const clear = () => setFilters(initialFilters);

  return (
    <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-col md:flex-row">
      {/* SIDEBAR — desktop only */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-outline-variant bg-surface-container-lowest md:flex md:flex-col">
        <div className="border-b border-outline-variant p-6">
          <h2 className="font-display text-lg font-bold text-on-surface">Filters</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <FilterGroup title="Sport">
            {SPORTS.map((sport) => (
              <RadioOption
                key={sport.key}
                name="sport"
                checked={filters.sport === sport.key}
                onChange={() => setFilters((prev) => ({ ...prev, sport: sport.key }))}
                label={sport.label}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Region">
            {COUNTRIES.map((country) => (
              <RadioOption
                key={country.code}
                name="country"
                checked={filters.country === country.code}
                onChange={() => setFilters((prev) => ({ ...prev, country: country.code }))}
                label={country.label}
              />
            ))}
          </FilterGroup>
          <FilterGroup title="Funding Stage">
            {STAGES.map((stage) => (
              <RadioOption
                key={stage.key}
                name="stage"
                checked={filters.stage === stage.key}
                onChange={() => setFilters((prev) => ({ ...prev, stage: stage.key }))}
                label={stage.label}
              />
            ))}
          </FilterGroup>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low p-6">
          <Button tone="primary" size="md" className="w-full" onClick={() => undefined}>
            Update Results
          </Button>
          <button
            type="button"
            onClick={clear}
            className="mt-3 w-full text-xs font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
          >
            Clear all filters
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 px-5 py-10 md:px-8 md:py-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-extrabold leading-tight text-on-surface md:text-5xl">
            Athlete Directory
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
            Fueling the next generation of champions through transparent, direct-to-athlete financial support.
          </p>
        </header>

        {/* SEARCH */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search by name, sport, or region…"
              className="w-full rounded-input border border-outline-variant bg-surface-container-lowest px-12 py-4 text-base text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </label>
          {/* Mobile filter pills */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 no-scrollbar md:hidden">
            {SPORTS.map((sport) => {
              const active = filters.sport === sport.key;
              return (
                <button
                  key={sport.key}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, sport: sport.key }))}
                  className={`label-bold whitespace-nowrap rounded-pill px-4 py-2 transition-colors ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {sport.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* RESULTS */}
        {filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
            <Badge tone="soft">No matching athletes</Badge>
            <p className="mt-4 text-on-surface-variant">
              We&rsquo;re still onboarding athletes that fit these filters. Check back soon — or forward ARC to someone who fits.
            </p>
            <div className="mt-6">
              <LinkButton tone="secondary" size="md" href="/sign-up">
                Apply as an athlete
              </LinkButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map((athlete) => (
              <AthleteRow key={athlete.athleteSlug} athlete={athlete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <p className="label-bold mb-4 text-on-surface">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RadioOption({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-secondary"
      />
      <span
        className={`text-sm transition-colors group-hover:text-secondary ${
          checked ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
