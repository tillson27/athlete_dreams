'use client';

import Image from 'next/image';
import type { FeedItem } from '@/lib/communityFeed';
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
              className="font-display text-base font-bold text-on-surface hover:text-primary"
            >
              {item.athleteName}
            </a>
            {item.verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <Icon name="check-badge" className="h-3.5 w-3.5" />
                Verified
              </span>
            ) : null}
            <span className="text-xs text-on-surface-variant">· {item.when}</span>
          </div>
          <p className="text-xs text-on-surface-variant">{item.discipline}</p>
        </div>
        <FollowButton slug={item.athleteSlug} variant="chip" />
      </div>

      <div className="px-5 pb-4">
        <p className="text-on-surface">{item.headline}</p>
        <p
          className={`mt-1 ${
            item.kind === 'result'
              ? 'font-display text-lg font-bold text-on-surface'
              : 'label-bold text-primary'
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
          className={`inline-flex items-center gap-1.5 text-sm font-bold transition-colors ${
            cheered ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Icon name={cheered ? 'heart' : 'heart-outline'} className="h-5 w-5" />
          {cheerCount}
        </button>
        <a
          href={athleteProfileHref(item.athleteSlug)}
          className="label-bold ml-auto inline-flex items-center gap-1 text-secondary hover:underline"
        >
          View profile
        </a>
      </div>
    </article>
  );
}
