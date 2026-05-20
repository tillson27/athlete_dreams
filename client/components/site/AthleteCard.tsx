import Link from 'next/link';
import Image from 'next/image';
import type { MockAthlete } from '@/lib/mockAthletes';
import { formatCents, formatSport } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

export function AthleteCard({ athlete }: { athlete: MockAthlete }) {
  return (
    <Link
      href={`/athletes/${athlete.athleteSlug}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-inset ring-ink/5 transition-shadow hover:shadow-xl"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/10">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} portrait`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/45 to-transparent px-5 py-4 text-paper">
          <Badge tone="ink">{formatSport(athlete.primarySport)}</Badge>
          <p className="mt-3 font-display text-2xl leading-tight">{athlete.fullName}</p>
          <p className="text-sm text-paper/80">{athlete.hometown}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <p className="line-clamp-3 text-sm text-ink/75">{athlete.headline}</p>
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">
            {formatCents(athlete.totalRaisedCents)} raised
          </span>
          <span className="text-ink/60">
            {athlete.activeCampaignCount} active campaign{athlete.activeCampaignCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  );
}
