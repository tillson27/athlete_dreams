import Link from 'next/link';
import Image from 'next/image';
import type { MockAthlete } from '@/lib/mockAthletes';
import { formatCents, formatSport, daysUntil } from '@/lib/format';
import { VerifiedChip, Badge, LiveDot } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

function getPrimaryCampaign(athlete: MockAthlete) {
  return athlete.campaigns[0];
}

function getCardMetrics(athlete: MockAthlete) {
  const primary = getPrimaryCampaign(athlete);
  if (!primary) {
    return {
      raisedAmountCents: athlete.totalRaisedCents,
      targetAmountCents: athlete.totalRaisedCents,
      supporterCount: 0,
      closesAt: null as string | null,
    };
  }
  return {
    raisedAmountCents: primary.raisedAmountCents,
    targetAmountCents: primary.targetAmountCents,
    supporterCount: primary.supporterCount,
    closesAt: primary.closesAt,
  };
}

/* -----------------------------------------------------------
 * Card: hero-photo above stats. Used on home / featured grids.
 * -----------------------------------------------------------*/
export function AthleteCard({ athlete }: { athlete: MockAthlete }) {
  const metrics = getCardMetrics(athlete);

  return (
    <Link
      href={`/athletes/${athlete.athleteSlug}`}
      className="card-lift card-lift-hover group relative flex w-full min-w-[300px] flex-col overflow-hidden rounded-card bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/60"
    >
      <div className="relative h-64 w-full overflow-hidden bg-surface-container">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} portrait`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute right-4 top-4">
          <VerifiedChip />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-8">
        <div>
          <h4 className="font-display text-2xl font-bold leading-tight text-on-surface">
            {athlete.fullName}
          </h4>
          <p className="label-bold mt-1 text-secondary">
            {formatSport(athlete.primarySport)} • {athlete.hometown}
          </p>
        </div>
        <ProgressBar
          raisedAmountCents={metrics.raisedAmountCents}
          targetAmountCents={metrics.targetAmountCents}
          variant="compact"
        />
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="label-bold text-on-surface-variant">Raised</p>
            <p className="font-display text-xl font-bold text-on-surface">
              {formatCents(metrics.raisedAmountCents)}
            </p>
          </div>
          <div>
            <p className="label-bold text-on-surface-variant">Backers</p>
            <p className="font-display text-xl font-bold text-on-surface">
              {metrics.supporterCount}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -----------------------------------------------------------
 * Row: photo-left, stats-right. Used in the directory list.
 * -----------------------------------------------------------*/
export function AthleteRow({ athlete }: { athlete: MockAthlete }) {
  const metrics = getCardMetrics(athlete);
  const daysLeft = metrics.closesAt ? daysUntil(metrics.closesAt) : null;

  return (
    <Link
      href={`/athletes/${athlete.athleteSlug}`}
      className="card-lift card-lift-hover group flex flex-col overflow-hidden rounded-card bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/60 md:h-72 md:flex-row"
    >
      <div className="relative h-64 w-full overflow-hidden md:h-full md:w-80">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} portrait`}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        {athlete.activeCampaignCount > 0 ? (
          <div className="absolute left-4 top-4">
            <Badge tone="live">
              <LiveDot tone="on-primary" />
              Live Funding
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-5 p-6 md:p-7">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-2xl font-bold leading-tight text-on-surface md:text-[26px]">
              {athlete.fullName}
            </h3>
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-success">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" />
              </svg>
              Verified
            </span>
          </div>
          <p className="label-bold text-on-surface-variant">
            {formatSport(athlete.primarySport)} • {athlete.hometown}
          </p>
          <p className="line-clamp-2 text-sm text-on-surface-variant">{athlete.headline}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat label="Goal" value={formatCents(metrics.targetAmountCents)} />
          <Stat label="Backers" value={String(metrics.supporterCount)} />
          <Stat
            label="Days Left"
            value={daysLeft !== null && daysLeft >= 0 ? String(daysLeft) : '—'}
          />
        </div>

        <ProgressBar
          raisedAmountCents={metrics.raisedAmountCents}
          targetAmountCents={metrics.targetAmountCents}
          variant="compact"
        />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-bold text-on-surface-variant">{label}</p>
      <p className="font-display text-lg font-bold text-on-surface">{value}</p>
    </div>
  );
}
