import Link from 'next/link';
import Image from 'next/image';
import type { MockAthlete } from '@/lib/mockAthletes';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { formatSport } from '@/lib/format';

const LEVEL_LABEL: Record<MockAthlete['runnerLevel'], string> = {
  ELITE: 'Pro & Elite',
  COMPETITIVE: 'Competitive',
  EVERYDAY: 'Everyday',
};

// Story-first directory row: photo-left, story-right. Leads with the athlete's
// discipline, signature result, and story — never funding metrics.
export function AthleteRow({ athlete }: { athlete: MockAthlete }) {
  const profile = findAthleteProfile(athlete.athleteSlug);
  const disciplineLabel = profile?.disciplineLabel ?? formatSport(athlete.primarySport);
  const followers = profile?.followers;
  const topHighlight =
    profile?.careerHighlights[0]?.detail ?? athlete.accomplishments[0]?.title ?? null;

  return (
    <Link
      href={`/athletes/${athlete.athleteSlug}`}
      className="card-lift card-lift-hover group flex flex-col overflow-hidden rounded-card bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/60 md:h-72 md:flex-row"
    >
      <div className="relative h-64 w-full overflow-hidden md:h-full md:w-80">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} running`}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-pill bg-inverse-surface/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
            {LEVEL_LABEL[athlete.runnerLevel]}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-5 p-6 md:p-7">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-bold leading-tight text-on-surface md:text-[26px]">
              {athlete.fullName}
            </h3>
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-success">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" />
              </svg>
              Verified
            </span>
          </div>
          <p className="label-bold text-secondary">
            {disciplineLabel} • {athlete.hometown}
          </p>
          <p className="line-clamp-2 text-sm text-on-surface-variant">{athlete.headline}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {topHighlight ? (
            <span className="inline-flex items-center gap-2 rounded-pill bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface">
              <MedalIcon className="h-4 w-4 shrink-0 text-primary" />
              {topHighlight}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-3 text-sm text-on-surface-variant">
            {followers ? (
              <span>
                <strong className="text-on-surface">{followers}</strong> followers
              </span>
            ) : null}
            <span className="label-bold inline-flex items-center gap-1 text-primary transition-transform group-hover:translate-x-0.5">
              View profile
              <ArrowIcon className="h-4 w-4" />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2 8 8h8l-4-6Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 11Z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
