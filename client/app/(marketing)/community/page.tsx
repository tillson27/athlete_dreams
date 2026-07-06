import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Community — Coming Soon',
  description:
    'Your athletic network in one live feed — milestones, training, race results, and funding momentum. Coming soon to Arc.',
};

const img = (id: string, width = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

const following = [
  { name: 'Cassandra', initials: 'CW', ring: 'text-primary', offset: 47 },
  { name: 'Leo Vance', initials: 'LV', ring: 'text-secondary', offset: 141 },
  { name: 'Sarah', initials: 'SM', ring: null },
  { name: 'Marcus', initials: 'MS', ring: null },
  { name: 'Elena', initials: 'EK', ring: null },
];

const sports = ['All Sports', 'Running', 'Climbing', 'Bodybuilding', 'Cycling', 'Swimming'];

const trending = [
  { rank: 1, name: 'Jackson Reed', sport: 'Swimming' },
  { rank: 2, name: 'Mina Choi', sport: 'Archery' },
  { rank: 3, name: 'Priya Shah', sport: 'Climbing' },
];

export default function CommunityPage() {
  return (
    <>
      {/* COMING SOON HERO */}
      <section className="border-b border-outline-variant bg-gradient-to-b from-surface-container-low to-surface py-16 md:py-20">
        <div className="mx-auto max-w-[var(--spacing-container-max)] px-5 text-center md:px-16">
          <span className="inline-flex items-center gap-2 rounded-pill bg-primary-soft px-4 py-1.5 text-xs font-bold uppercase tracking-[0.05em] text-primary">
            <Icon name="groups" className="h-4 w-4" />
            Community
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-on-surface md:text-6xl">
            Coming soon
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            Your athletic network in one live feed — milestones, training sessions, race results,
            and the moments in between. Here&rsquo;s a preview of what&rsquo;s coming to Arc.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-pill bg-inverse-surface px-5 py-2.5 text-sm font-bold text-white">
              <span className="pulse-live inline-block h-2 w-2 rounded-full bg-primary-container" />
              Launching soon
            </span>
            <Link
              href="/athletes"
              className="inline-flex items-center gap-2 rounded-pill border border-outline-variant px-5 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
            >
              Explore athletes
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEED PREVIEW */}
      <section className="relative py-12 md:py-16">
        <div className="mx-auto max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="label-bold text-on-surface-variant">Feed preview</h2>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
              A look at the live feed
            </span>
          </div>

          <div aria-hidden className="pointer-events-none select-none">
            {/* Following tray */}
            <section className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 label-bold text-on-surface-variant">
                Following
                <span className="pulse-live h-2 w-2 rounded-full bg-primary" />
              </h3>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {following.map((person) => (
                  <div key={person.name} className="flex shrink-0 flex-col items-center gap-2">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      {person.ring ? (
                        <svg viewBox="0 0 64 64" className="absolute h-16 w-16 -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="30"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-surface-container"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="30"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="188.5"
                            strokeDashoffset={person.offset}
                            className={person.ring}
                          />
                        </svg>
                      ) : (
                        <span className="absolute h-16 w-16 rounded-full border-2 border-outline-variant" />
                      )}
                      <Avatar initials={person.initials} className="h-12 w-12 text-sm" />
                    </div>
                    <span className="text-xs">{person.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Sport filters */}
            <section className="mb-8">
              <div className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
                {sports.map((sport, index) => (
                  <span
                    key={sport}
                    className={`shrink-0 rounded-pill px-6 py-2 label-bold ${
                      index === 0
                        ? 'border border-primary bg-surface-container-low text-primary'
                        : index === 1 || index === 2
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </section>

            {/* Feed grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                {/* Roadmap milestone */}
                <article className="overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-[4px_4px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between border-b border-primary/10 bg-primary/10 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Icon name="trophy" className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Roadmap Milestone
                      </span>
                    </div>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-bold tracking-tighter text-on-primary">
                      MILESTONE ACHIEVED
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="relative">
                        <Avatar initials="CW" className="h-12 w-12 ring-2 ring-primary/20" />
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-secondary text-white">
                          <Icon name="sync" className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-xl font-bold leading-tight">
                            Milestone Achieved
                          </h4>
                          <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                            Fitness Tracker Sync
                          </span>
                        </div>
                        <p>
                          <span className="font-bold">Cassandra de Winter</span> reached a major
                          milestone on her &ldquo;Epic&rdquo;:{' '}
                          <span className="font-bold text-primary">
                            Qualifying for the Toronto Waterfront Marathon Championship!
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mb-6 flex items-center gap-2 px-1">
                      <div className="flex -space-x-1.5">
                        <span className="h-5 w-5 rounded-full border border-white bg-surface-variant" />
                        <span className="h-5 w-5 rounded-full border border-white bg-primary-container" />
                        <span className="h-5 w-5 rounded-full border border-white bg-secondary-container" />
                      </div>
                      <span className="text-[11px] font-medium text-on-surface-variant">
                        42 others congratulated her
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 label-bold text-on-primary shadow-sm">
                        <Icon name="celebration" className="h-4 w-4" />
                        Celebrate
                      </span>
                      <span className="flex-[1.5] rounded-lg border border-outline-variant py-3 text-center text-sm label-bold text-on-surface-variant">
                        View Updated Roadmap
                      </span>
                    </div>
                  </div>
                </article>

                {/* Training photo */}
                <article className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest shadow-[4px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Training
                    </span>
                    <span className="text-[10px] label-bold text-on-surface-variant">Session #42</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials="CW" className="h-10 w-10 text-xs" />
                      <div>
                        <p className="label-bold">Cassandra de Winter</p>
                        <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Icon name="camera" className="h-3.5 w-3.5" />2 hours ago
                        </p>
                      </div>
                    </div>
                    <Icon name="more" className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <div className="relative aspect-square">
                    <Image
                      src={img('1486218119243-13883505764c', 900)}
                      alt="Cassandra training"
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover"
                    />
                    <div
                      className="absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1"
                      style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
                    >
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                        Off-Duty
                      </span>
                    </div>
                    <div
                      className="absolute bottom-4 right-4 rounded-xl border border-white/20 px-4 py-2"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-tighter text-white/70">
                        Performance Data
                      </p>
                      <div className="flex items-center gap-3 text-white">
                        <div>
                          <span className="block text-xs font-bold">PACE</span>
                          <span className="text-sm font-black">
                            4:32<small className="text-[10px] font-normal">/km</small>
                          </span>
                        </div>
                        <div className="h-6 w-px bg-white/20" />
                        <div>
                          <span className="block text-xs font-bold">ELEV</span>
                          <span className="text-sm font-black">
                            420<small className="text-[10px] font-normal">m</small>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-4">
                      <div className="flex gap-4 text-on-surface-variant">
                        <Icon name="heart" className="h-5 w-5 text-primary" />
                        <Icon name="chat" className="h-5 w-5" />
                        <Icon name="share" className="h-5 w-5" />
                      </div>
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                        <Icon name="rocket" className="h-4 w-4" />$5 Boost
                      </span>
                    </div>
                    <p>
                      <span className="font-bold">Cassandra de Winter:</span> &ldquo;Training with
                      the little one today. Finding balance in the chaos before the next big
                      qualifying heat.&rdquo;
                    </p>
                  </div>
                </article>

                {/* Strava run */}
                <article className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest shadow-[4px_4px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Training
                    </span>
                    <span className="text-[10px] label-bold text-on-surface-variant">Tempo Run</span>
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <Avatar initials="CW" className="h-10 w-10 text-xs" />
                    <div className="flex-1">
                      <p className="label-bold">
                        Cassandra de Winter{' '}
                        <span className="font-normal text-on-surface-variant">
                          just finished a 12km Tempo Run
                        </span>
                      </p>
                      <p className="text-xs text-on-surface-variant">4 hours ago</p>
                    </div>
                    <span className="rounded bg-[#FC4C02]/10 px-2 py-1 text-[10px] font-bold text-[#FC4C02]">
                      STRAVA
                    </span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-outline-variant bg-surface-container-low px-4 py-2">
                    {[
                      { label: 'Time', value: '52:10' },
                      { label: 'Pace', value: '4:21/km' },
                      { label: 'Avg HR', value: '162' },
                    ].map((stat) => (
                      <div key={stat.label} className="py-2 text-center">
                        <p className="text-[10px] uppercase label-bold text-on-surface-variant">
                          {stat.label}
                        </p>
                        <p className="font-display text-lg font-bold text-primary">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-48">
                    <Image
                      src={img('1476480862126-209bfaa8edc8', 1000)}
                      alt="Run route"
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover"
                    />
                    <div
                      className="absolute bottom-4 left-4 flex gap-4 rounded-lg px-3 py-2"
                      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                    >
                      <div className="text-white">
                        <span className="block text-[8px] font-bold uppercase opacity-70">
                          Distance
                        </span>
                        <span className="text-xs font-black">
                          12.04 <small className="font-normal">km</small>
                        </span>
                      </div>
                      <div className="text-white">
                        <span className="block text-[8px] font-bold uppercase opacity-70">
                          Duration
                        </span>
                        <span className="text-xs font-black">52m 10s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-surface-container p-4">
                    <div className="flex -space-x-2">
                      <span className="h-6 w-6 rounded-full border border-surface-container-lowest bg-secondary-container" />
                      <span className="h-6 w-6 rounded-full border border-surface-container-lowest bg-primary-container" />
                      <span className="h-6 w-6 rounded-full border border-surface-container-lowest bg-surface-variant" />
                    </div>
                    <span className="text-xs label-bold text-on-surface-variant">
                      Leo Vance and 12 others gave kudos
                    </span>
                  </div>
                </article>

                {/* Race result — new PB */}
                <article className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-green-50/40 shadow-[4px_4px_20px_rgba(0,0,0,0.06)]">
                  <span className="absolute right-[-30px] top-[15px] z-10 rotate-45 bg-primary px-10 py-1 text-[10px] font-extrabold tracking-widest text-white shadow">
                    NEW PB
                  </span>
                  <div className="flex items-center justify-between border-b border-surface-container bg-surface-container-low px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      Race Result
                    </span>
                    <span className="text-[10px] label-bold text-on-surface-variant">Major Event</span>
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar initials="SM" className="h-10 w-10 text-xs" />
                        <div>
                          <p className="label-bold">Sarah Miller</p>
                          <p className="text-[10px] uppercase label-bold text-on-surface-variant">
                            Elite Runner
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[10px] font-black text-white shadow-sm">
                        <Icon name="trophy" className="h-3.5 w-3.5" />
                        WINNER
                      </span>
                    </div>
                    <h4 className="mb-2 font-display text-xl font-bold">London Marathon Results</h4>
                    <p className="text-on-surface-variant">
                      Sarah Miller finished <span className="font-bold text-on-surface">1st</span> at
                      the London Marathon! A stunning performance with a PB time of{' '}
                      <span className="font-black text-on-surface">2:18:44</span>.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                        #LondonMarathon
                      </span>
                      <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                        #Champion
                      </span>
                    </div>
                  </div>
                </article>
              </div>

              {/* Sidebar */}
              <div className="hidden space-y-6 lg:col-span-4 lg:block">
                <section className="rounded-xl bg-surface-container-high p-6">
                  <h3 className="mb-4 label-bold uppercase text-on-surface-variant">
                    Trending Athletes
                  </h3>
                  <div className="space-y-4">
                    {trending.map((athlete) => (
                      <div key={athlete.name} className="flex items-center gap-3">
                        <span className="w-4 font-bold text-primary">{athlete.rank}</span>
                        <Avatar initials={athlete.name.slice(0, 1)} className="h-10 w-10 text-xs" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">{athlete.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{athlete.sport}</p>
                        </div>
                        <Icon name="trending" className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary">
                  <span className="absolute right-4 top-4 opacity-10">
                    <Icon name="rocket" className="h-16 w-16" />
                  </span>
                  <Icon name="rocket" className="mb-2 h-6 w-6" />
                  <h3 className="mb-2 font-display text-xl font-bold">Crowdfund 2.0</h3>
                  <p className="mb-4 text-sm opacity-90">
                    A new matching program starts soon. Your boosts will be doubled for all junior
                    athletes.
                  </p>
                  <span className="block rounded-lg bg-on-primary-container px-4 py-2 text-center text-sm font-bold text-primary-container">
                    Learn More
                  </span>
                </section>
              </div>
            </div>
          </div>

          {/* fade to signal preview */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent"
          />
        </div>
      </section>
    </>
  );
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-primary-container font-bold uppercase text-on-primary-container ${className ?? 'h-10 w-10'}`}
    >
      {initials}
    </span>
  );
}

type IconName =
  | 'groups'
  | 'arrow'
  | 'trophy'
  | 'sync'
  | 'celebration'
  | 'camera'
  | 'more'
  | 'heart'
  | 'chat'
  | 'share'
  | 'rocket'
  | 'trending';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    groups: (
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3 0-6 1.5-6 4.5V20h8v-2.5c0-1.2.5-2.3 1.3-3.2A9.6 9.6 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .2 1.2 1 2 2.3 2 3.8V20h6v-2.5c0-3-3-4.5-6-4.5Z" />
    ),
    arrow: (
      <path
        d="M4 10h12m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    trophy: (
      <path d="M6 4h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 13H7a4 4 0 0 1-4-4V6h3V4Zm12 4V6h-1.2A6 6 0 0 1 18 8Zm-12 0a6 6 0 0 1 1.2-2H6v2Z" />
    ),
    sync: (
      <path d="M12 6V3L8 7l4 4V8a4 4 0 0 1 3.9 5H18a6 6 0 0 0-6-7Zm-3.9 5H6a6 6 0 0 0 6 7v3l4-4-4-4v3a4 4 0 0 1-3.9-5Z" />
    ),
    celebration: (
      <path d="m2 22 5-14 9 9-14 5Zm7.5-9.5L7 15l4.5-1.5-2-2ZM14 2l1.2 2.5L18 6l-2.8 1.5L14 10l-1.2-2.5L10 6l2.8-1.5L14 2Zm6 6 .8 1.7L23 11l-2.2.9L20 14l-.8-2.1L17 11l2.2-1.3L20 8Z" />
    ),
    camera: (
      <path d="M9 3h6l1.5 2H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5L9 3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    ),
    more: <path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />,
    heart: (
      <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" />
    ),
    chat: <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Z" />,
    share: (
      <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" />
    ),
    rocket: (
      <path d="M12 2c3 1 6 4.5 6 9 0 1.6-.4 3-.9 4.2l-1.6-1.6a5 5 0 0 0 .5-2.6c0-2.9-1.7-5.4-4-6.6-2.3 1.2-4 3.7-4 6.6a5 5 0 0 0 .5 2.6L6.9 15.2A10.2 10.2 0 0 1 6 11c0-4.5 3-8 6-9Zm-2 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM8 18l2-1 2 3 2-3 2 1-1 4H9l-1-4Z" />
    ),
    trending: <path d="M3 17l6-6 4 4 8-8v5h-2V9.4l-6 6-4-4L4.4 18 3 17Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className ?? 'h-6 w-6'}>
      {paths[name]}
    </svg>
  );
}
