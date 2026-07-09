'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buildFeed, buildRacingSoon, type FeedItem, type FeedCategory } from '@/lib/communityFeed';
import { useFollows } from '@/lib/follows';
import { useSession } from '@/lib/session';
import { createBrowserStore } from '@/lib/browserStore';
import { Icon } from '@/components/ui/Icon';
import { FollowButton } from '@/components/site/FollowButton';
import type { MockAthlete } from '@/lib/mockAthletes';

const cheersStore = createBrowserStore<Record<string, boolean>>('arc-cheers', 'arc-cheers-change');

// All-day Google Calendar link for a parseable race date; null keeps the UI honest.
function calendarHref(title: string, dateText: string): string | null {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = (offset: number) => {
    const d = new Date(parsed);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  };
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${day(0)}/${day(1)}`;
}

const DISCIPLINES: Array<{ key: MockAthlete['primarySport'] | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Runners' },
  { key: 'RUNNING', label: 'Road, Trail & Ultra' },
];

const FEED_TYPES: Array<{ key: FeedCategory | 'ALL'; label: string; icon: 'hub' | 'flag' | 'timer' | 'medal' }> = [
  { key: 'ALL', label: 'All updates', icon: 'hub' },
  { key: 'race', label: 'Races', icon: 'flag' },
  { key: 'training', label: 'Training runs', icon: 'timer' },
  { key: 'milestone', label: 'Milestones', icon: 'medal' },
];

export function CommunityClient() {
  const feed = useMemo(() => buildFeed(), []);
  const racingSoon = useMemo(() => buildRacingSoon(), []);
  const { follows, ready } = useFollows();
  const { session } = useSession();

  const [tab, setTab] = useState<'everyone' | 'following'>('everyone');
  const [discipline, setDiscipline] = useState<MockAthlete['primarySport'] | 'ALL'>('ALL');
  const [feedType, setFeedType] = useState<FeedCategory | 'ALL'>('ALL');
  const [cheered, setCheered] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCheered(cheersStore.read() ?? {});
  }, []);

  const visible = feed.filter((item) => {
    if (discipline !== 'ALL' && item.primarySport !== discipline) return false;
    if (feedType !== 'ALL' && item.category !== feedType) return false;
    if (tab === 'following' && !follows.includes(item.athleteSlug)) return false;
    return true;
  });

  const toggleCheer = (id: string) =>
    setCheered((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      cheersStore.write(next);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-10 md:px-16 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-pill bg-secondary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] text-secondary">
          <Icon name="timer" className="h-3.5 w-3.5" />
          Coming soon
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
          Community
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">
          Here&rsquo;s a preview of what&rsquo;s coming. Soon this will be a live feed of verified
          results and the road ahead, from the runners you follow — cheer them on and never miss a
          start line. The journey is better with people in it.
        </p>
      </header>

      {/* Tabs + discipline filters */}
      <div className="mb-6 flex flex-col gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 rounded-pill bg-surface-container p-1">
          <TabButton active={tab === 'everyone'} onClick={() => setTab('everyone')}>
            Everyone
          </TabButton>
          <TabButton active={tab === 'following'} onClick={() => setTab('following')}>
            Following{ready && follows.length > 0 ? ` · ${follows.length}` : ''}
          </TabButton>
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar md:mx-0 md:px-0">
          {DISCIPLINES.map((entry) => {
            const active = discipline === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setDiscipline(entry.key)}
                className={`label-bold whitespace-nowrap rounded-pill px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content-type filters */}
      <div className="mb-6 -mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar md:mx-0 md:px-0">
        {FEED_TYPES.map((entry) => {
          const active = feedType === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFeedType(entry.key)}
              className={`label-bold inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-sm transition-colors ${
                active
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon name={entry.icon} className="h-4 w-4" />
              {entry.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Feed */}
        <div className="space-y-5 lg:col-span-8">
          {tab === 'following' && ready && follows.length === 0 ? (
            <EmptyFollowing signedIn={Boolean(session)} />
          ) : visible.length === 0 ? (
            <p className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              Nothing here yet for this filter.
            </p>
          ) : (
            visible.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                cheered={Boolean(cheered[item.id])}
                onCheer={() => toggleCheer(item.id)}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-1 font-display text-lg font-bold text-on-surface">Racing soon</h2>
            <p className="mb-4 text-xs text-on-surface-variant">Be there when it counts.</p>
            <ul className="space-y-4">
              {racingSoon.map((entry) => (
                <li key={entry.athleteSlug} className="flex items-center gap-3">
                  <Link
                    href={`/athletes/${entry.athleteSlug}`}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container"
                  >
                    <Image src={entry.avatar} alt={entry.athleteName} fill sizes="40px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/athletes/${entry.athleteSlug}`}
                      className="label-bold block truncate text-on-surface hover:text-primary"
                    >
                      {entry.athleteName}
                    </Link>
                    <p className="truncate text-xs text-on-surface-variant">
                      {entry.event} · {entry.date}
                    </p>
                  </div>
                  {calendarHref(`${entry.athleteName} — ${entry.event}`, entry.date) ? (
                    <a
                      href={calendarHref(`${entry.athleteName} — ${entry.event}`, entry.date)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Add race day to your calendar"
                      title="Add to calendar"
                      className="rounded-pill p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    >
                      <Icon name="calendar" className="h-4 w-4" />
                    </a>
                  ) : null}
                  <FollowButton slug={entry.athleteSlug} variant="chip" />
                </li>
              ))}
            </ul>
          </section>

          <section className="relative overflow-hidden rounded-card bg-inverse-surface p-6 text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:36px_36px]"
            />
            <div className="relative">
              <h3 className="font-display text-xl font-bold">Your run, your story.</h3>
              <p className="mt-2 text-sm text-white/75">
                Build a verified profile and let people follow your whole journey.
              </p>
              <Link
                href="/sign-up"
                className="label-bold mt-4 inline-flex rounded-button bg-primary-container px-5 py-2.5 text-on-primary transition-colors hover:bg-primary"
              >
                Start your profile
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill px-4 py-1.5 text-sm font-bold transition-colors ${
        active ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

function FeedCard({
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
        <Link
          href={`/athletes/${item.athleteSlug}`}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-container"
        >
          <Image src={item.avatar} alt={item.athleteName} fill sizes="44px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={`/athletes/${item.athleteSlug}`}
              className="font-display text-base font-bold text-on-surface hover:text-primary"
            >
              {item.athleteName}
            </Link>
            {item.verified ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                <CheckBadge className="h-3.5 w-3.5" />
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
          <HeartIcon filled={cheered} className="h-5 w-5" />
          {cheerCount}
        </button>
        <Link
          href={`/athletes/${item.athleteSlug}`}
          className="label-bold ml-auto inline-flex items-center gap-1 text-secondary hover:underline"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

function EmptyFollowing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
      <h3 className="font-display text-xl font-bold text-on-surface">
        You&rsquo;re not following anyone yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-on-surface-variant">
        Follow runners to build your feed — their verified results and upcoming races show up here.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/athletes"
          className="label-bold rounded-button bg-primary px-6 py-3 text-on-primary transition-colors hover:bg-primary-strong"
        >
          Discover runners
        </Link>
        {!signedIn ? (
          <Link
            href="/sign-in"
            className="label-bold rounded-button border-2 border-outline px-6 py-3 text-on-surface transition-colors hover:bg-surface-container"
          >
            Sign in
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" />
    </svg>
  );
}

function CheckBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" />
    </svg>
  );
}
