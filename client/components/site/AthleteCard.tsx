import Link from 'next/link';
import Image from 'next/image';
import type { AthleteDirectoryItem } from 'fad-common';
import { formatSport } from '@/lib/format';
import { directoryLevelLabel } from '@/lib/api/athleteViews';
import { Icon } from '@/components/ui/Icon';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=1400&q=70';

export function AthleteRow({ athlete }: { athlete: AthleteDirectoryItem }) {
  const disciplineLabel = athlete.disciplineLabel ?? formatSport(athlete.primarySport);
  const topHighlight = athlete.values?.[0] ?? null;

  return (
    <Link
      href={`/athletes/${athlete.athleteSlug}`}
      className="card-lift card-lift-hover group flex flex-col overflow-hidden rounded-card bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/60 md:h-72 md:flex-row"
    >
      <div className="relative h-64 w-full overflow-hidden bg-surface-container md:h-full md:w-80">
        <Image
          src={athlete.heroMediaUrl ?? FALLBACK_IMAGE}
          alt={`${athlete.fullName} running`}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-pill bg-inverse-surface/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
            {directoryLevelLabel(athlete.athleteLevel)}
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
            {athlete.followerCount !== undefined ? (
              <span>
                <strong className="text-on-surface">{athlete.followerCount}</strong> followers
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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
