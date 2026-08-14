'use client';

import Image from 'next/image';
import type { FeedItem } from '@/lib/communityFeed';
import { formatFeedDate } from '@/lib/format';
import { athleteProfileHref } from '@/lib/profileUrl';
import { Icon } from '@/components/ui/Icon';
import { FollowButton } from '@/components/site/FollowButton';

export function FeedCard({
  item,
  cheered,
  onCheer,
}: {
  item: FeedItem;
  cheered: boolean;
  onCheer: () => void;
}) {
  const cheerCount = item.cheers + (cheered ? 1 : 0);
  const dateStamp = formatFeedDate(item.occurredAt) ?? item.when;
  return (
    <article className="card-lift overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-start gap-3 p-5">
        <a
          href={athleteProfileHref(item.athleteSlug)}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-container"
        >
          <Image src={item.avatar} alt={item.athleteName} fill sizes="44px" className="object-cover" />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <a
              href={athleteProfileHref(item.athleteSlug)}
              className="inline-flex min-h-11 items-center font-display text-base font-bold text-on-surface hover:text-primary"
            >
              {item.athleteName}
            </a>
          </div>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-on-surface-variant">
            <span>{item.discipline}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.occurredAt ?? undefined} className="font-semibold">
              {dateStamp}
            </time>
          </p>
        </div>
        <FollowButton slug={item.athleteSlug} variant="chip" />
      </div>

      <div className="px-5 pb-4">
        <p className="text-on-surface">{item.headline}</p>
        <p
          className={`mt-1 ${
            item.kind === 'result'
              ? 'font-display text-lg font-bold text-on-surface'
              : 'label-bold text-on-surface'
          }`}
        >
          {item.detail}
        </p>
      </div>

      {item.photo ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
          <Image src={item.photo} alt="" fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
        </div>
      ) : null}

      <div className="flex items-center gap-4 border-t border-outline-variant px-5 py-3">
        <button
          type="button"
          onClick={onCheer}
          aria-pressed={cheered}
          className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-bold transition-colors ${
            cheered ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Icon name={cheered ? 'heart' : 'heart-outline'} className="h-5 w-5" />
          {cheerCount}
        </button>
        <a
          href={athleteProfileHref(item.athleteSlug)}
          className="label-bold ml-auto inline-flex min-h-11 items-center gap-1 text-secondary hover:underline"
        >
          View profile
        </a>
      </div>
    </article>
  );
}
