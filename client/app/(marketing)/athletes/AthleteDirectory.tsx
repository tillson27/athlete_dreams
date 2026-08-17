'use client';

import { useEffect, useMemo, useState } from 'react';
import { AthleteRow } from '@/components/site/AthleteCard';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { findMockAthlete, type MockAthlete } from '@/lib/mockAthletes';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { useDirectoryAthletes } from '@/lib/dataSource';
import { athleteRouteFromPath, type AthleteRoute } from '@/lib/profileUrl';
import { nameFromSlug } from '@/lib/slugify';
import { unsplashPhoto } from '@/lib/unsplash';
import { AthleteProfileHydrator } from './[athleteSlug]/AthleteProfileHydrator';
import { ManageProfile } from './[athleteSlug]/manage/ManageProfile';

const COUNTRIES: Array<{ code: MockAthlete['countryCode'] | 'ALL'; label: string }> = [
  { code: 'ALL', label: 'Anywhere' },
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'United States' },
];

type Filters = {
  country: MockAthlete['countryCode'] | 'ALL';
  search: string;
};

const initialFilters: Filters = {
  country: 'ALL',
  search: '',
};

const ATHLETE_PAGE_SIZE = 12;
const FALLBACK_COVER = unsplashPhoto('1594882645126-14020914d58d', 1400);

export function AthleteDirectory() {
  const { athletes, loading, error } = useDirectoryAthletes();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [hasReadUrl, setHasReadUrl] = useState(false);
  const [runtimeRoute, setRuntimeRoute] = useState<AthleteRoute | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const initialPage = Number.parseInt(params.get('page') ?? '1', 10);

    setRuntimeRoute(athleteRouteFromPath(window.location.pathname, params));
    setFilters({
      country: countryFromParam(params.get('country')),
      search: params.get('search') ?? '',
    });
    setPage(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1);
    setHasReadUrl(true);
  }, []);

  const filtered = useMemo(() => {
    return athletes.filter((athlete) => {
      if (filters.country !== 'ALL' && athlete.countryCode !== filters.country) return false;
      const search = filters.search.trim();
      if (search) {
        const needle = search.toLowerCase();
        const profile = findAthleteProfile(athlete.athleteSlug);
        const hay =
          `${athlete.fullName} ${athlete.hometown} ${athlete.headline} ${profile?.disciplineLabel ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [athletes, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ATHLETE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ATHLETE_PAGE_SIZE;
  const pagedAthletes = filtered.slice(pageStart, pageStart + ATHLETE_PAGE_SIZE);
  const paginationPages = paginationWindow(currentPage, totalPages);
  const isFiltered = filters.country !== 'ALL' || filters.search.trim().length > 0;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!hasReadUrl || runtimeRoute !== null || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    const search = filters.search.trim();

    if (filters.country !== 'ALL') params.set('country', filters.country);
    if (search) params.set('search', search);
    if (currentPage > 1) params.set('page', String(currentPage));

    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [currentPage, filters, hasReadUrl, runtimeRoute]);

  const updateFilters = (nextFilters: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
    setPage(1);
  };

  const clear = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  if (runtimeRoute?.kind === 'manage') {
    const athlete = findMockAthlete(runtimeRoute.athleteSlug);
    return (
      <ManageProfile
        athleteSlug={runtimeRoute.athleteSlug}
        athleteName={athlete?.fullName ?? nameFromSlug(runtimeRoute.athleteSlug)}
        initialCoverPhoto={athlete?.heroMediaUrl ?? FALLBACK_COVER}
      />
    );
  }

  if (runtimeRoute?.kind === 'profile') {
    const athlete = findMockAthlete(runtimeRoute.athleteSlug);
    const profile = findAthleteProfile(runtimeRoute.athleteSlug);
    return (
      <AthleteProfileHydrator
        athleteSlug={runtimeRoute.athleteSlug}
        athlete={athlete}
        profile={profile}
      />
    );
  }

  if (loading) {
    return <DirectoryState title="Loading runners" body="Fetching the latest athlete directory." />;
  }

  if (error) {
    return (
      <DirectoryState
        title="Directory unavailable"
        body="We could not load the live athlete directory. Refresh to try again."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-col md:flex-row">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-outline-variant bg-surface-container-lowest md:flex md:flex-col">
        <div className="border-b border-outline-variant p-6">
          <h2 className="font-display text-lg font-bold text-on-surface">Filters</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <FilterGroup title="Region">
            {COUNTRIES.map((country) => (
              <RadioOption
                key={country.code}
                name="country"
                checked={filters.country === country.code}
                onChange={() => updateFilters({ country: country.code })}
                label={country.label}
              />
            ))}
          </FilterGroup>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low p-6">
          <p className="text-sm text-on-surface-variant">
            <strong className="text-on-surface">{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'runner' : 'runners'}
          </p>
          {isFiltered ? (
            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      </aside>

      <main className="flex-1 px-5 py-8 md:px-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="font-display text-[28px] font-extrabold leading-tight text-on-surface sm:text-3xl md:text-5xl">
            Discover runners
          </h1>
          <p className="mt-2 max-w-2xl text-base text-on-surface-variant md:mt-3 md:text-lg">
            Runners telling the whole story — from first finish lines to podiums. Follow the
            ones whose journey you want to be part of.
          </p>
        </header>

        <div className="mb-6 space-y-3 md:mb-8 md:space-y-4">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search name, discipline, or city…"
              className="w-full rounded-input border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-base text-on-surface shadow-sm transition-all placeholder:text-on-surface-variant focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30 md:px-12 md:py-4"
            />
          </label>

          <div className="md:hidden">
            <div
              className="grid grid-cols-3 gap-1 rounded-[8px] border border-outline-variant bg-surface-container p-1 shadow-sm"
              role="group"
              aria-label="Region filters"
            >
              {COUNTRIES.map((country) => {
                const active = filters.country === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilters({ country: country.code })}
                    className={`flex min-h-9 min-w-0 items-center justify-center rounded-[6px] px-2 text-center text-[13px] font-bold leading-none transition-colors ${
                      active
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-lowest hover:text-on-surface'
                    }`}
                  >
                    {country.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-on-surface-variant">
                <strong className="text-on-surface">{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'runner' : 'runners'}
              </p>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-semibold text-on-surface-variant underline underline-offset-2 transition-colors hover:text-primary"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center md:p-12">
            <Badge tone="soft">No matching runners</Badge>
            <p className="mt-4 text-sm text-on-surface-variant md:text-base">
              We&rsquo;re still onboarding runners that fit these filters. Check back soon — or forward
              ARC to someone who fits.
            </p>
            <div className="mt-6">
              <LinkButton tone="secondary" size="md" href="/sign-up">
                Start your profile
              </LinkButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {pagedAthletes.map((athlete) => (
                <AthleteRow key={athlete.athleteSlug} athlete={athlete} />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
              >
                <PageButton onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                  Prev
                </PageButton>
                {paginationPages.map((paginationPage) => (
                  <PageButton
                    key={paginationPage}
                    active={paginationPage === currentPage}
                    onClick={() => setPage(paginationPage)}
                  >
                    {paginationPage}
                  </PageButton>
                ))}
                <PageButton
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </PageButton>
              </nav>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function DirectoryState({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-12 text-center sm:py-16">
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-on-surface">{title}</h1>
        <p className="mt-3 text-on-surface-variant">{body}</p>
      </div>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
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

function countryFromParam(value: string | null): Filters['country'] {
  const country = COUNTRIES.find((option) => option.code === value);
  return country?.code ?? 'ALL';
}

function paginationWindow(currentPage: number, totalPages: number): number[] {
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxVisiblePages + 1));
  return Array.from({ length: maxVisiblePages }, (_, index) => startPage + index);
}

function PageButton({
  active = false,
  disabled = false,
  children,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`label-bold min-h-10 min-w-10 rounded-input px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:text-primary'
      }`}
    >
      {children}
    </button>
  );
}
