import Image from 'next/image';
import type { MockAthlete } from '@/lib/mockAthletes';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { formatSport } from '@/lib/format';
import { athleteProfileHref } from '@/lib/profileUrl';
import { Icon } from '@/components/ui/Icon';

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
    <a
      href={athleteProfileHref(athlete.athleteSlug)}
      className="card-lift card-lift-hover group flex flex-col overflow-hidden rounded-card bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/60 md:h-72 md:flex-row"
    >
      <div className="relative h-64 w-full overflow-hidden bg-surface-container md:h-full md:w-80">
        {athlete.heroMediaUrl ? (
          <Image
            src={athlete.heroMediaUrl}
            alt={`${athlete.fullName} running`}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : null}
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
              <Icon name="check-badge" className="h-4 w-4" />
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
              <Icon name="medal" className="h-4 w-4 shrink-0 text-primary" />
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
    </a>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
