import Image from 'next/image';
import Link from 'next/link';
import type { MockAthlete } from '@/lib/mockAthletes';
import { formatCents, formatProgress } from '@/lib/format';
import { ArrowGlyph } from '@/components/ui/Button';
import { ShareCard, type ShareResume } from './ShareCard';

// Faithful reproduction of the Stitch "Cassandra de Winter" athlete profile
// (athlete_profile_previous_races_with_photo_galleries). Data specific to this
// mock lives here rather than polluting the shared MockAthlete schema.

const img = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

const personalBests = [
  { label: '10km', value: '35:26' },
  { label: 'Half Marathon', value: '1:12:54' },
  { label: 'Marathon', value: '2:34:43' },
  { label: '100km', value: '10:03:12' },
];

const careerHighlights = [
  {
    title: '2026 Boston Marathon',
    detail: '1st Canadian Female (27th Overall) — 2:34:43',
    tone: 'secondary' as const,
    images: ['1552674605-db6ffd4facb5', '1461896836934-ffe607ba8211'],
  },
  {
    title: '2025 Lost Soul Ultra 100km',
    detail: '1st Overall (Course Record) — 10:03',
    tone: 'primary' as const,
    images: ['1476480862126-209bfaa8edc8', '1519750157634-b6d493a0f77c'],
  },
];

const moreResults = [
  {
    title: '2025 Royal Victoria Marathon',
    detail: '1st Place Female — 2:39:50',
    images: ['1508973379184-7517410fb0bc', '1530143311094-34d807799e8f'],
  },
  {
    title: '2025 Black Spur Ultra 54km',
    detail: '1st Place Female (Course Record) — 5:26:00',
    images: ['1517637633369-e4cc28755e01', '1486218119243-13883505764c'],
  },
];

const previousRaces = [
  {
    name: 'Boston Marathon (Pro Start)',
    date: 'Monday, April 20, 2026',
    result: '1st Canadian Female — 2:34:43 (PB)',
    tone: 'secondary' as const,
    links: ['Official B.A.A. Results', 'Running Magazine Recap', 'CBC Article'],
    images: ['1540539234-c14a20fb7c7b'],
  },
  {
    name: 'Moonlight Run 10K',
    date: 'Saturday, March 21, 2026',
    result: '1st Female, CR — 35:26',
    tone: 'primary' as const,
    links: ['10K Results', 'Timing Page'],
    images: ['1486739985386-d4fae04ca6f7'],
  },
  {
    name: 'Mesa Half Marathon',
    date: 'Saturday, February 14, 2026',
    result: '4th Female — 1:12:54',
    tone: 'secondary' as const,
    links: ['World Athletics Results', 'Official Mesa Marathon Results'],
    images: ['1596727147705-61a532a659bd', '1533560904424-a0c61dc306fc'],
  },
];

const morePreviousRaces = [
  {
    name: 'Royal Victoria Marathon',
    date: 'Oct 12, 2025',
    result: '1st Female — 2:39:50',
    images: ['1530143311094-34d807799e8f', '1508973379184-7517410fb0bc'],
  },
  {
    name: 'Lost Soul Ultra 100km',
    date: 'Sept 5–6, 2025',
    result: '1st Overall, CR — 10:03:12',
    images: ['1476480862126-209bfaa8edc8', '1519750157634-b6d493a0f77c'],
  },
  {
    name: 'Black Spur Ultra 54km',
    date: 'Aug 22–23, 2025',
    result: '1st Female, CR — 5:26:00',
    images: ['1533560904424-a0c61dc306fc', '1596727147705-61a532a659bd'],
  },
];

const coreValues = [
  { title: 'Resilience', body: 'Pushing beyond limits.' },
  { title: 'Sustainability', body: 'Earth-first athletics.' },
  { title: 'Community', body: 'Growing the trail scene.' },
  { title: 'Excellence', body: 'Uncompromising quality.' },
];

const roadmap = [
  { name: 'Edmonton Half Marathon', date: 'August 16, 2026' },
  { name: 'Lost Soul 100-miler', date: 'Sept 11, 2026' },
  {
    name: 'Toronto Waterfront Marathon',
    date: 'Oct 17-18, 2026',
    raisedCents: 20000,
    targetCents: 200000,
  },
];

const instagramPosts = [
  { id: '1502904550040-7534597429ae', likes: '1.2k' },
  { id: '1486218119243-13883505764c', likes: '856' },
  { id: '1517637633369-e4cc28755e01', likes: '2.3k' },
];

const recentBackers = [
  { name: 'Sarah M.', when: '2 days ago', amountCents: 5000, initials: 'SM' },
  { name: 'RunClub Toronto', when: '3 days ago', amountCents: 20000, icon: 'groups' as const },
  { name: 'Anonymous', when: '5 days ago', amountCents: 2500, icon: 'person' as const },
];

const galleryPhotos = [
  '1508973379184-7517410fb0bc',
  '1530143311094-34d807799e8f',
  '1596727147705-61a532a659bd',
  '1552674605-db6ffd4facb5',
];

export function CassandraProfile({ athlete }: { athlete: MockAthlete }) {
  const campaign = athlete.campaigns[0];
  const targetCents = campaign?.targetAmountCents ?? 0;
  const raisedCents = campaign?.raisedAmountCents ?? 0;
  const percent = formatProgress(raisedCents, targetCents);
  const remainingCents = Math.max(0, targetCents - raisedCents);

  const shareResume: ShareResume = {
    name: athlete.fullName,
    tagline: 'Elite Endurance & Trail',
    location: athlete.hometown,
    photo: athlete.heroMediaUrl,
    highlights: [
      '1st Canadian Female — Boston Marathon (2:34:43)',
      '1st Female — Royal Victoria Marathon (2:39:50)',
      '1st Overall, CR — Lost Soul Ultra 100km',
      '1st Female, CR — Black Spur Ultra 54km',
    ],
    previousRaces: [
      'Boston Marathon — 1st Canadian Female (2:34:43)',
      'Moonlight Run 10K — 1st Female, CR (35:26)',
      'Mesa Half Marathon — 4th Female (1:12:54)',
      'Royal Victoria Marathon — 1st Female (2:39:50)',
      'Lost Soul Ultra 100km — 1st Overall, CR (10:03:12)',
      'Black Spur Ultra 54km — 1st Female, CR (5:26:00)',
    ],
    stats: [
      { label: 'Marathon PB', value: '2:34:43' },
      { label: '100km', value: '10:03:12' },
      { label: 'Backers', value: String(campaign?.supporterCount ?? 0) },
      { label: '10km PB', value: '35:26' },
      { label: 'Half Marathon', value: '1:12:54' },
    ],
    url: `arc.network/athletes/${athlete.athleteSlug}`,
  };

  return (
    <div className="pb-16">
      {/* HERO */}
      <section className="relative h-[60vh] w-full overflow-hidden md:h-[70vh]">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} trail running`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-8 text-white md:px-16 md:py-12">
          <span className="mb-3 inline-flex items-center gap-1 rounded-pill bg-success px-3 py-1 text-xs font-bold tracking-[0.05em] text-white">
            <Icon name="check" className="h-4 w-4" />
            Verified Athlete
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            {athlete.fullName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-white/90">
            <p className="label-bold inline-flex items-center gap-1">
              <Icon name="trail" className="h-4 w-4" />
              Elite Endurance &amp; Trail
            </p>
            <span className="hidden h-1 w-1 rounded-full bg-white/50 md:block" />
            <p className="label-bold inline-flex items-center gap-1">
              <Icon name="location" className="h-4 w-4" />
              {athlete.hometown}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        {/* STATS BAR & QUICK ACTIONS */}
        <section className="relative z-10 -mt-12">
          <div className="card-lift flex flex-col items-center justify-between gap-8 rounded-card bg-surface-container-lowest p-6 md:flex-row md:p-8">
            <div className="grid w-full grid-cols-2 gap-8 border-b border-surface-container-high pb-6 text-center md:w-auto md:border-b-0 md:pb-0 md:text-left">
              <div>
                <p className="label-bold mb-1 text-on-surface-variant">Goal</p>
                <p className="font-display text-2xl font-bold text-on-surface">
                  {formatCents(targetCents)}
                </p>
              </div>
              <div>
                <p className="label-bold mb-1 text-on-surface-variant">Raised</p>
                <p className="font-display text-2xl font-bold text-secondary">
                  {formatCents(raisedCents)}
                </p>
              </div>
            </div>

            <div className="w-full space-y-2 md:w-1/4">
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded bg-success/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.05em] text-success">
                  <Icon name="shield" className="h-3.5 w-3.5" />
                  Transparency Score: 100%
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="label-bold text-on-surface">{percent}% Funded</span>
                <span className="label-bold text-on-surface-variant">
                  {formatCents(remainingCents)} Remaining
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-pill bg-surface-container">
                <div
                  className="progress-gradient h-full rounded-pill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
              <Link
                href="#back"
                className="inline-flex min-h-12 items-center justify-center rounded-button bg-primary-container px-8 py-4 text-sm font-bold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
              >
                BACK THIS ATHLETE
              </Link>
              <ShareCard resume={shareResume} />
              <Link
                href={`/athletes/${athlete.athleteSlug}/manage`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-outline px-8 py-4 text-sm font-bold tracking-[0.05em] text-secondary transition-colors hover:bg-surface-container-low active:scale-95"
              >
                <Icon name="edit" className="h-4 w-4" />
                ATHLETE VIEW
              </Link>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="space-y-6 md:col-span-8">
            {/* Featured Video */}
            <section className="card-lift rounded-card bg-surface-container-lowest p-8">
              <CardHeading icon="play">Featured Video</CardHeading>
              <div className="group relative mt-6 aspect-video cursor-pointer overflow-hidden rounded-input">
                <Image
                  src={img('1461896836934-ffe607ba8211', 1200)}
                  alt="Featured video thumbnail"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                    <Icon name="play" className="h-9 w-9 text-white" />
                  </span>
                </div>
                <span className="absolute bottom-4 left-4 rounded bg-primary px-3 py-1 text-xs font-bold text-on-primary">
                  2:45
                </span>
              </div>
            </section>

            {/* My Story */}
            <article className="card-lift rounded-card bg-surface-container-lowest p-8">
              <CardHeading icon="book">My Story</CardHeading>
              <div className="mt-4 text-lg leading-relaxed text-on-surface">
                <p className="mb-4">
                  Mother of three, endurance athlete, and former national rugby player. My journey
                  is about movement, competition, and showing my children what it looks like to
                  chase big goals&hellip;
                </p>
                <details className="group">
                  <summary className="label-bold inline-flex cursor-pointer list-none items-center gap-1 text-primary transition-all hover:underline group-open:hidden">
                    See more
                    <Icon name="chevron" className="h-4 w-4" />
                  </summary>
                  <div className="space-y-4">
                    <p>
                      My name is Cassandra de Winter, and before anything else, I&rsquo;m a mom to
                      three young kids. My mornings begin early, balancing training with the
                      familiar rhythm of little ones waking before the sun and finding their way
                      into my bedroom. However, in the midst of motherhood, I&rsquo;ve found my way
                      back to something that has always been part of who I am: movement,
                      competition, and the drive to push my limits.
                    </p>
                    <p>
                      In 2025, after a few years focused on growing my family, I returned to sport
                      through endurance racing. What started as a quiet comeback quickly turned into
                      something much bigger. Running became more than just training&mdash;it became a
                      way to reconnect with myself, to rediscover strength, and to show my children
                      what it looks like to chase something wholeheartedly.
                    </p>
                    <p>
                      My background in national-level rugby and strength sport gave me a foundation,
                      but stepping into the endurance world has felt like starting fresh in the most
                      humbling and exciting way. I&rsquo;m new to this space, which means I bring a
                      different kind of perspective&mdash;one rooted in gratitude, curiosity, and a
                      deep respect for the process.
                    </p>
                    <p>
                      My journey is about more than performance&mdash;it&rsquo;s about the life
                      around it. Balancing high-level training with motherhood, finding purpose in
                      both, and inviting others&mdash;especially women and mothers&mdash;to believe
                      that there is still space for their own ambitions.
                    </p>
                  </div>
                </details>
              </div>
            </article>

            {/* Personal Bests */}
            <div className="card-lift rounded-card bg-surface-container-lowest p-8">
              <CardHeading icon="timer">Personal Bests</CardHeading>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {personalBests.map((best) => (
                  <div key={best.label} className="rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">{best.label}</p>
                    <p className="font-display text-xl font-bold text-on-surface">{best.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career Highlights */}
            <div className="card-lift rounded-card bg-surface-container-lowest p-8">
              <CardHeading icon="medal">Career Highlights</CardHeading>
              <div className="mt-6 space-y-4">
                {careerHighlights.map((highlight) => (
                  <HighlightDropdown key={highlight.title} {...highlight} />
                ))}

                <details className="group">
                  <summary className="label-bold flex cursor-pointer list-none items-center justify-center gap-2 py-3 text-primary hover:underline">
                    SEE MORE RESULTS
                    <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-4">
                    {moreResults.map((result) => (
                      <HighlightDropdown
                        key={result.title}
                        title={result.title}
                        detail={result.detail}
                        tone="primary"
                        images={result.images}
                      />
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* Previous Races */}
            <section className="card-lift rounded-card bg-surface-container-lowest p-8">
              <CardHeading icon="history">Previous Races</CardHeading>
              <div className="mt-6 space-y-6">
                {previousRaces.map((race) => (
                  <RaceDropdown key={race.name} {...race} />
                ))}

                <details className="group mt-2">
                  <summary className="label-bold flex cursor-pointer list-none items-center justify-center gap-2 py-3 text-primary hover:underline">
                    SEE MORE RACES (2025 &amp; PRIOR)
                    <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 space-y-6">
                    {morePreviousRaces.map((race) => (
                      <RaceDropdown
                        key={race.name}
                        name={race.name}
                        date={race.date}
                        result={race.result}
                        tone="primary"
                        images={race.images}
                      />
                    ))}
                  </div>
                </details>
              </div>
            </section>

            {/* Core Values */}
            <div className="card-lift rounded-card bg-inverse-surface p-8 text-white">
              <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-primary-container">
                <Icon name="diamond" className="h-6 w-6" />
                Core Values
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {coreValues.map((value) => (
                  <div
                    key={value.title}
                    className="rounded-input border border-white/15 p-4"
                  >
                    <p className="label-bold mb-1 text-primary-container">{value.title}</p>
                    <p className="text-xs text-white/70">{value.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-6 md:col-span-4">
            {/* Community */}
            <div className="card-lift space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <CardHeading icon="groups">Community</CardHeading>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-display text-3xl font-bold text-on-surface">12.4k</p>
                  <p className="label-bold text-on-surface-variant">Followers</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-on-surface">
                    {campaign?.supporterCount ?? 0}
                  </p>
                  <p className="label-bold text-on-surface-variant">Backers</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-button bg-primary-container py-3 text-sm font-bold tracking-[0.05em] text-on-primary shadow-md transition-colors hover:bg-primary active:scale-95"
              >
                <Icon name="person-add" className="h-5 w-5" />
                FOLLOW
              </button>
            </div>

            {/* 2026 Roadmap */}
            <div className="card-lift rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <h3 className="mb-6 font-display text-xl font-bold text-on-surface">2026 Roadmap</h3>
              <div className="space-y-6">
                {roadmap.map((event) => {
                  if (event.targetCents) {
                    const eventPercent = formatProgress(event.raisedCents, event.targetCents);
                    return (
                      <div key={event.name} className="-m-2 block rounded-input p-2">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="label-bold text-on-surface">{event.name}</p>
                            <p className="text-xs text-on-surface-variant">{event.date}</p>
                          </div>
                          <span className="label-bold shrink-0 text-secondary">
                            {formatCents(event.raisedCents)} / {formatCents(event.targetCents)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-container">
                          <div
                            className="progress-gradient h-full"
                            style={{ width: `${eventPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={event.name}>
                      <p className="label-bold text-on-surface">{event.name}</p>
                      <p className="text-xs text-on-surface-variant">{event.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instagram */}
            <div className="card-lift space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="instagram" className="h-5 w-5 text-primary" />
                  <h3 className="label-bold text-on-surface">@cassandradewinter</h3>
                </div>
                <button
                  type="button"
                  className="rounded border border-primary px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-surface-container-low"
                >
                  Follow
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {instagramPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded"
                  >
                    <Image
                      src={img(post.id, 300)}
                      alt={`Instagram post ${index + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon name="heart" className="h-4 w-4" />
                      <span className="text-[10px] font-bold">{post.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Training Feed */}
            <div className="card-lift space-y-6 rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-on-surface">
                  Live Training Feed
                </h3>
                <span className="rounded bg-[#FC4C02]/10 px-2 py-1 text-[10px] font-bold tracking-[0.05em] text-[#FC4C02]">
                  VERIFIED STRAVA
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-input border-t-2 border-[#FC4C02] bg-surface-container-low p-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Weekly KM</p>
                  <p className="font-bold">84.2</p>
                </div>
                <div className="border-x border-outline-variant text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Time</p>
                  <p className="font-bold">12h 15m</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Gain</p>
                  <p className="font-bold">2,450m</p>
                </div>
              </div>
              <div className="cursor-pointer">
                <p className="label-bold text-on-surface">Interval Session: Speed Work</p>
                <p className="text-xs text-on-surface-variant">Yesterday • 12.0 km • 52:10</p>
              </div>
              <button
                type="button"
                className="label-bold inline-flex w-full items-center justify-center gap-2 rounded-button border border-outline py-3 text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                FOLLOW ON STRAVA
                <Icon name="external" className="h-4 w-4" />
              </button>
            </div>

            {/* Recent Backers */}
            <div className="card-lift space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <h3 className="font-display text-xl font-bold text-on-surface">Recent Backers</h3>
              <div className="space-y-4">
                {recentBackers.map((backer) => (
                  <div key={backer.name} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-sm font-bold text-on-surface-variant">
                      {backer.initials ? (
                        backer.initials
                      ) : (
                        <Icon name={backer.icon ?? 'person'} className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="label-bold text-on-surface">{backer.name}</p>
                      <p className="text-xs text-on-surface-variant">{backer.when}</p>
                    </div>
                    <div className="font-bold text-secondary">
                      {formatCents(backer.amountCents)}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="label-bold inline-flex w-full items-center justify-center gap-1 py-2 text-primary hover:underline"
              >
                See all backers
                <ArrowGlyph className="h-4 w-4" />
              </button>
            </div>

            {/* Photo Gallery */}
            <div className="card-lift space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6">
              <CardHeading icon="gallery">Photo Gallery</CardHeading>
              <div className="grid grid-cols-2 gap-2">
                {galleryPhotos.map((photo, index) => (
                  <div
                    key={photo}
                    className="relative aspect-square cursor-pointer overflow-hidden rounded transition-opacity hover:opacity-90"
                  >
                    <Image
                      src={img(photo, 400)}
                      alt={`Gallery photo ${index + 1}`}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="label-bold inline-flex w-full items-center justify-center gap-1 py-2 text-primary hover:underline"
              >
                View Full Gallery
                <ArrowGlyph className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>

        {/* BACK CTA anchor target */}
        <section
          id="back"
          className="relative mt-8 overflow-hidden rounded-card bg-inverse-surface px-6 py-12 text-center text-white md:px-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
          />
          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Back {athlete.fullName.split(' ')[0]}&rsquo;s 2026 season.
            </h2>
            <p className="mt-3 text-white/75">
              Donations move directly to {athlete.fullName.split(' ')[0]} after a 3% platform fee —
              with a receipt, a thank-you, and a post-event recap.
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-button bg-primary-container px-8 py-4 text-sm font-bold tracking-[0.05em] text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
            >
              BACK THIS ATHLETE
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function HighlightDropdown({
  title,
  detail,
  tone,
  images,
}: {
  title: string;
  detail: string;
  tone: 'primary' | 'secondary';
  images: string[];
}) {
  const accent =
    tone === 'secondary'
      ? 'border-secondary-soft bg-secondary-soft/30 text-secondary'
      : 'border-outline-variant bg-surface-container-low text-primary';
  const chip = tone === 'secondary' ? 'bg-secondary text-white' : 'bg-primary text-white';

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between rounded-input border p-4 transition-colors ${accent}`}
      >
        <div className="flex gap-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${chip}`}>
            <Icon name="medal" className="h-5 w-5" />
          </span>
          <div>
            <p className="label-bold text-on-surface">{title}</p>
            <p className="text-xs text-on-surface-variant">{detail}</p>
          </div>
        </div>
        <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-4 rounded-b-input border-x border-b border-outline-variant bg-surface-container-low/40 p-4">
        {images.map((image, index) => (
          <div
            key={`${title}-${index}`}
            className="relative aspect-[3/4] overflow-hidden rounded-input"
          >
            <Image
              src={img(image, 500)}
              alt={`${title} photo ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function RaceDropdown({
  name,
  date,
  result,
  tone,
  links,
  images,
}: {
  name: string;
  date: string;
  result: string;
  tone: 'primary' | 'secondary';
  links?: string[];
  images: string[];
}) {
  const accent = tone === 'secondary' ? 'border-secondary' : 'border-primary';

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-start justify-between rounded-r-input border-l-4 bg-surface-container-low/40 p-5 transition-colors hover:bg-surface-container-low/60 ${accent}`}
      >
        <div className="flex-1">
          <h4 className="text-lg font-bold text-on-surface">{name}</h4>
          <p className="text-xs text-on-surface-variant">
            {date} • {result}
          </p>
        </div>
        <Icon
          name="chevron"
          className={`h-5 w-5 transition-transform group-open:rotate-180 ${
            tone === 'secondary' ? 'text-secondary' : 'text-primary'
          }`}
        />
      </summary>
      <div
        className={`space-y-4 rounded-br-input border-l-4 bg-surface-container-low/20 p-5 ${accent}`}
      >
        {links && links.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {links.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary"
              >
                <Icon name="link" className="h-4 w-4" />
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className={images.length > 1 ? 'grid grid-cols-2 gap-2' : 'overflow-hidden rounded-input'}>
          {images.map((image, index) => (
            <div
              key={`${name}-${index}`}
              className={`relative overflow-hidden rounded-input ${
                images.length > 1 ? 'aspect-[4/5]' : 'aspect-[16/9]'
              }`}
            >
              <Image
                src={img(image, 900)}
                alt={`${name} photo ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

function CardHeading({
  icon,
  children,
}: {
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 font-display text-xl font-bold text-on-surface">
      <Icon name={icon} className="h-6 w-6 text-primary" />
      {children}
    </h3>
  );
}

type IconName =
  | 'check'
  | 'trail'
  | 'location'
  | 'shield'
  | 'play'
  | 'book'
  | 'timer'
  | 'medal'
  | 'trophy'
  | 'history'
  | 'diamond'
  | 'groups'
  | 'person'
  | 'person-add'
  | 'gallery'
  | 'instagram'
  | 'heart'
  | 'chevron'
  | 'link'
  | 'external'
  | 'edit'
  | 'share';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    check: <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" />,
    trail: <path d="M14 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3.5 2.5L8 11l2 2v6h2v-7l-2-2 2.5-2.5L15 10l3 1 .6-1.8-2.4-.8-2.5-3a2 2 0 0 0-1.6-.8c-.5 0-1 .2-1.4.5L6.5 8 8 9.5l2.5-2.5Z" />,
    location: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />,
    shield: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />,
    play: <path d="M6 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 6 4.5Z" />,
    book: <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13V3H6Zm0 2h11v12H6a2 2 0 0 0-1 .27V5Zm2 2v2h7V7H8Zm0 4v2h7v-2H8Z" />,
    timer: <path d="M9 1h6v2H9V1Zm3 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 10h-2V9h2v6Z" />,
    medal: <path d="M12 2 8 8h8l-4-6Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 11Z" />,
    trophy: <path d="M6 4h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 13H7a4 4 0 0 1-4-4V6h3V4Zm12 4V6h-1.2A6 6 0 0 1 18 8Zm-12 0a6 6 0 0 1 1.2-2H6v2Z" />,
    history: <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.4 1.5A9 9 0 1 0 13 3Zm-1 4v5l4.3 2.6.7-1.2-3.5-2.1V7H12Z" />,
    diamond: <path d="M6 2h12l4 6-10 14L2 8l4-6Zm.5 2L4 8h5.2l1.3-4H6.5Zm5.5 0-1.3 4h2.6L12 4Zm2.3 0 1.3 4H20l-2.5-4h-2.7Z" />,
    groups: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3 0-6 1.5-6 4.5V20h8v-2.5c0-1.2.5-2.3 1.3-3.2A9.6 9.6 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .2 1.2 1 2 2.3 2 3.8V20h6v-2.5c0-3-3-4.5-6-4.5Z" />,
    person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />,
    'person-add': <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h12v-1c0-2.8 0-5 -4-5Zm9-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" />,
    gallery: <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9l4-4 3 3 3-3 3 3V6H5Zm3 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />,
    instagram: <path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.64.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.06 15.58 2.05 15.2 2.05 12s0-3.58.07-4.85C2.27 3.96 3.79 2.42 7.02 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.64A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />,
    heart: <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" />,
    chevron: <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    link: <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3-3a3 3 0 0 0-4.2-4.2l-1 1 1.4 1.4 1-1a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0l-3 3a3 3 0 0 0 4.2 4.2l1-1-1.4-1.4-1 1a1 1 0 1 1-1.4-1.4l3-3a1 1 0 0 0 0-1.4Z" />,
    external: <path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3Zm-9 2h5v2H5v12h12v-5h2v7H3V5h2Z" />,
    edit: <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />,
    share: <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" />,
  };

  const isStroke = name === 'chevron';

  return (
    <svg
      viewBox="0 0 24 24"
      fill={isStroke ? 'none' : 'currentColor'}
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
