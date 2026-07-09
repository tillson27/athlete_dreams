import Image from 'next/image';
import Link from 'next/link';
import { formatCents } from '@/lib/format';
import { TrendingAthletes, type TrendingAthlete } from '@/components/site/TrendingAthletes';
import { Reveal } from '@/components/site/Reveal';
import { unsplashPhoto as img } from '@/lib/unsplash';
import { Icon, type IconName } from '@/components/ui/Icon';

const arcSteps: { number: string; title: string; body: string; icon: IconName; comingSoon?: boolean }[] = [
  {
    number: '01',
    title: 'Build Your Profile',
    body: 'Your stats prove the work. Your story is why it matters — put both in your own words.',
    icon: 'person-add',
  },
  {
    number: '02',
    title: 'Set Your Goals',
    body: 'Define your upcoming competitions and what you are chasing. Make the road ahead clear.',
    icon: 'target',
  },
  {
    number: '03',
    title: 'Build Your Community',
    body: 'Share your journey with friends and backers who see exactly where their support goes via transparency.',
    icon: 'groups',
    comingSoon: true,
  },
];

const trendingAthletes: TrendingAthlete[] = [
  {
    name: 'Cassandra de Winter',
    sport: 'Elite Endurance & Trail • Lethbridge, CAN',
    image: img('1502904550040-7534597429ae', 760),
    highlight: '2:34:43 Marathon PB',
    followers: '12.4k',
    href: '/athletes/cassandra-de-winter',
  },
  {
    name: 'Jordan Blackhorse',
    sport: 'Trail & Ultra • Flagstaff, USA',
    image: img('1476480862126-209bfaa8edc8', 760),
    highlight: 'Western States Golden Ticket',
    followers: '15.1k',
    href: '/athletes/jordan-blackhorse',
  },
  {
    name: 'Maya Okafor',
    sport: 'Road Marathon • Toronto, CAN',
    image: img('1571008887538-b36bb32f4571', 760),
    highlight: '2:34:11 Boston Marathon',
    followers: '9.8k',
    href: '/athletes/maya-okafor',
  },
  {
    name: 'Emma Chen',
    sport: 'Road Running • Vancouver, CAN',
    image: img('1540539234-c14a20fb7c7b', 760),
    highlight: 'First sub-1:50 half',
    followers: '812',
    href: '/athletes/emma-chen',
  },
];

const ledgerLines: { label: string; amountCents: number; receipt: boolean }[] = [
  { label: 'Race entries (5 events)', amountCents: 64000, receipt: true },
  { label: 'Flights + lodging', amountCents: 185000, receipt: true },
  { label: 'Coaching block', amountCents: 240000, receipt: true },
  { label: 'Physio + nutrition', amountCents: 120000, receipt: false },
];
const ledgerTotalCents = ledgerLines.reduce((sum, line) => sum + line.amountCents, 0);

const successStories = [
  {
    name: 'Félix Tremblay',
    sport: 'Para Road Racing • Canada',
    highlight: '1st Para Division, Montréal Marathon',
    followers: '6.2k',
    quote: 'Running gave me back forward motion — literally. Every race, I carry the kids I met in the hospital with me.',
    image: img('1508973379184-7517410fb0bc', 900),
    href: '/athletes/felix-tremblay',
  },
  {
    name: 'Cassandra de Winter',
    sport: 'Ultramarathon • Canada',
    highlight: 'Course record, Lost Soul Ultra 100km',
    followers: '12.4k',
    quote: 'I’m running the 100-miler to show my kids what chasing something wholeheartedly looks like.',
    image: img('1502904550040-7534597429ae', 900),
    href: '/athletes/cassandra-de-winter',
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative flex h-[540px] w-full items-center overflow-hidden bg-inverse-surface md:h-[640px]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={img('1571008887538-b36bb32f4571', 1920)}
            alt="Elite athlete running a marathon"
            fill
            priority
            sizes="100vw"
            className="ken-burns object-cover object-[center_30%]"
          />
        </div>
        {/* warm directional wash for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#140b08]/90 via-[#160d09]/60 to-[#160d09]/20"
        />
        {/* vignette to focus the frame */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 105% at 50% 32%, transparent 42%, rgba(9,5,3,0.78) 100%)',
          }}
        />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="max-w-3xl">
            <h1 className="font-display text-balance text-4xl font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-sm md:text-6xl">
              Your <span className="text-primary-container">athletic</span> journey. Your{' '}
              <span className="text-primary-container">Arc</span>. Told in one place.
            </h1>
            <p className="mb-10 mt-6 max-w-xl text-2xl font-bold text-white/90 md:text-3xl">
              Because finish lines are only part of the story&hellip;
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-8 py-4 text-lg font-bold text-on-primary shadow-lg shadow-primary-container/25 transition-all hover:-translate-y-0.5 hover:bg-primary active:scale-95"
              >
                Build your story
              </Link>
              <Link
                href="/mission"
                className="inline-flex items-center justify-center gap-2 rounded-button border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                Our mission
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
          <span className="scroll-cue flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </section>

      {/* TELL YOUR ARC */}
      <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-surface-container-low to-white py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-5 [background-image:radial-gradient(circle_at_center,_var(--color-primary)_1px,_transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-6 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Tell Your Arc
              </h2>
              <p className="text-lg leading-relaxed text-on-surface-variant">
                Your athletic career deserves a professional home. Launch your athlete profile in
                three simple steps designed for elite performance.
              </p>
            </div>
          </Reveal>

          <div className="mx-auto mb-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            {arcSteps.map((step, index) => (
              <Reveal key={step.number} delay={index * 90} className="h-full">
                <div className="group relative flex h-full flex-col items-center rounded-card border border-outline-variant/30 bg-white/60 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_26px_50px_-24px_rgba(171,54,0,0.4)]">
                  <span className="absolute left-5 top-4 font-display text-2xl font-extrabold text-primary/20">
                    {step.number}
                  </span>
                  {step.comingSoon && (
                    <span className="absolute right-4 top-4 rounded-pill bg-secondary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-secondary">
                      Coming soon
                    </span>
                  )}
                  <div className="mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                      <Icon name={step.icon} className="h-8 w-8" />
                    </div>
                  </div>
                  <h4 className="mb-3 font-display text-xl font-bold text-on-surface">{step.title}</h4>
                  <p className="text-on-surface-variant">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-card bg-primary-container px-12 py-5 text-lg font-bold tracking-[0.05em] text-on-primary shadow-xl transition-all hover:-translate-y-1 hover:shadow-primary/25 active:scale-95"
            >
              Start your journey
            </Link>
          </div>
        </div>
      </section>

      {/* TRENDING ATHLETES */}
      <TrendingAthletes athletes={trendingAthletes} />

      {/* WHY ARC — the gap Arc closes */}
      <section className="relative overflow-hidden bg-surface">
        {/* Photographic header band */}
        <div className="relative overflow-hidden bg-inverse-surface">
          <div className="absolute inset-0">
            <Image
              src={img('1508973379184-7517410fb0bc', 1920)}
              alt="Sprinter driving out of the starting blocks"
              fill
              sizes="100vw"
              className="object-cover object-[center_30%]"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#140b08]/85 via-[#160d09]/80 to-surface"
          />
          <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-28 pt-20 md:px-16">
            <Reveal>
              <div className="max-w-3xl">
                <h2 className="mb-5 font-display text-4xl font-extrabold leading-[1.05] text-white md:text-5xl">
                  The Missing Bridge in{' '}
                  <span className="text-primary-container">Athletic Identity.</span>
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed text-white/75">
                  From fragmented posts to a unified legacy. Arc gives athletes one professional home
                  to turn their performance into a story worth following and supporting.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 mx-auto -mt-12 w-full max-w-[var(--spacing-container-max)] px-5 pb-24 md:px-16">
          {/* The problem — two forces Arc bridges */}
          <div className="relative">
            <div className="grid gap-6 md:grid-cols-2 md:gap-16">
              <Reveal className="h-full">
                <div className="card-lift flex h-full flex-col rounded-card border border-secondary/30 bg-white p-7">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
                      <Icon name="insights" className="h-6 w-6" />
                    </span>
                    <h4 className="font-display text-xl font-bold text-on-surface">The Strava Clutter</h4>
                  </div>
                  <p className="leading-relaxed text-on-surface-variant">
                    Valuable performance data is buried in a sea of random kudos and casual activity
                    history. While excellent for tracking, it lacks the{' '}
                    <strong className="font-bold text-on-surface">
                      intentionality of a professional resume
                    </strong>
                    .
                  </p>
                  <div className="mt-6 rounded-input bg-surface-container p-4">
                    <p className="eyebrow mb-3 flex items-center gap-2 text-on-surface-variant">
                      <Icon name="history" className="h-4 w-4" />
                      Lost in the noise
                    </p>
                    <div className="space-y-2">
                      {(
                        [
                          { icon: 'run', barWidth: 'w-2/3', opacity: 'opacity-90' },
                          { icon: 'trail', barWidth: 'w-1/2', opacity: 'opacity-60' },
                          { icon: 'timer', barWidth: 'w-3/5', opacity: 'opacity-35' },
                        ] as { icon: IconName; barWidth: string; opacity: string }[]
                      ).map((row) => (
                        <div key={row.icon} className={`flex items-center gap-2.5 ${row.opacity}`}>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-dim text-on-surface-variant">
                            <Icon name={row.icon} className="h-4 w-4" />
                          </span>
                          <span className={`h-2 rounded-pill bg-surface-dim ${row.barWidth}`} />
                          <span className="ml-auto h-4 w-10 shrink-0 rounded-pill bg-surface-dim" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={90} className="h-full">
                <div className="card-lift flex h-full flex-col rounded-card border border-primary/30 bg-white p-7">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon name="heart" className="h-6 w-6" />
                    </span>
                    <h4 className="font-display text-xl font-bold text-on-surface">The Instagram Trap</h4>
                  </div>
                  <p className="leading-relaxed text-on-surface-variant">
                    It&rsquo;s a{' '}
                    <strong className="font-bold text-on-surface">highlight reel, not a story</strong>
                    . It captures the peaks, but the full journey — and an athlete&rsquo;s past races
                    and results — gets lost in the scroll.
                  </p>
                  <div className="mt-6 rounded-input bg-surface-container p-4">
                    <p className="eyebrow mb-3 flex items-center gap-2 text-on-surface-variant">
                      <Icon name="gallery" className="h-4 w-4" />
                      The vanity metric
                    </p>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map((cell) => (
                        <div key={cell} className="h-9 flex-1 rounded-md bg-surface-dim" />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Connector — bridges the two problems on wide screens */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-6 left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white shadow-lg">
                <Icon name="run" className="h-6 w-6" />
              </span>
              <span className="my-2 w-px flex-1 bg-gradient-to-b from-secondary to-primary" />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
                <Icon name="camera" className="h-6 w-6" />
              </span>
            </div>
          </div>

          {/* What Arc builds instead */}
          <div className="mt-20 grid gap-12 md:grid-cols-2">
            <Reveal>
              <div>
                <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                  <Icon name="book" className="h-7 w-7" />
                </span>
                <h3 className="mb-4 font-display text-2xl font-bold text-on-surface md:text-3xl">
                  Unified Athletic Identity
                </h3>
                <p className="text-lg leading-relaxed text-on-surface-variant">
                  No more cobbling together fragmented posts across multiple platforms. In ARC, your
                  complete athletic narrative lives front and center — authentic, polished, and easy
                  for others to follow.
                </p>
                <div className="mt-6 border-l-4 border-primary pl-4">
                  <p className="eyebrow text-primary">Author your legacy</p>
                  <p className="mt-1 leading-relaxed text-on-surface-variant">
                    The premier storytelling platform for athletes who want their full journey seen,
                    supported, and celebrated.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div>
                <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
                  <Icon name="groups" className="h-7 w-7" />
                </span>
                <h3 className="mb-4 font-display text-2xl font-bold text-on-surface md:text-3xl">
                  From Spectators to Supporters
                </h3>
                <p className="text-lg leading-relaxed text-on-surface-variant">
                  Athletes who share their authentic stories create a powerful opportunity for
                  supporters to follow their journey, feel like an integral part of it, and
                  contribute meaningfully through donations and subscriptions.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BACKING TEASER — transparent support arrives after the story-first launch */}
      <section className="border-y border-outline-variant bg-surface-container-low py-24">
        <Reveal>
          <div className="mx-auto mb-16 w-full max-w-[var(--spacing-container-max)] px-5 text-center md:px-16">
            <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Backing your favourite runners is coming.
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              We&rsquo;re launching story-first, with crowdfunding coming next. You&rsquo;ll be able
              to fund a specific race, trip, gear purchase, or training block — chip in one-time or
              back an athlete&rsquo;s whole season, and see exactly where every dollar lands. Athletes
              keep their supporters updated with post-event recaps, so crowdfunding here feels less
              like a donation and more like being part of the team.
            </p>
          </div>
        </Reveal>
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Itemized-season preview — transparency you can audit */}
            <div className="flex flex-col items-start gap-6 rounded-card border border-outline-variant bg-white p-8 shadow-sm md:flex-row">
              <div className="flex-1">
                <Icon name="fact-check" className="mb-4 h-8 w-8 text-primary" />
                <h4 className="mb-3 font-display text-xl font-bold text-on-surface">
                  See where every dollar goes
                </h4>
                <p className="text-on-surface-variant">
                  Every campaign is an itemized season — race entries, travel, coaching, gear. Back
                  the exact line you want, and athletes prove each expense with{' '}
                  <strong className="font-bold text-on-surface">receipts</strong> and post-event
                  updates. No black box, no guessing.
                </p>
              </div>
              <div className="w-full rounded-input bg-surface-container p-4 text-sm md:w-72">
                <div className="mb-1 flex items-center justify-between">
                  <span className="eyebrow text-on-surface-variant">Where your dollars go</span>
                </div>
                {ledgerLines.map((line) => (
                  <div key={line.label} className="border-t border-outline-variant/60 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-on-surface">{line.label}</span>
                      <span className="shrink-0 font-bold text-on-surface">
                        {formatCents(line.amountCents)}
                      </span>
                    </div>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${
                        line.receipt ? 'text-success' : 'text-on-surface-variant'
                      }`}
                    >
                      {line.receipt ? (
                        <>
                          <Icon name="check-badge" className="h-3.5 w-3.5" />
                          Receipt attached
                        </>
                      ) : (
                        <>
                          <Icon name="timer" className="h-3.5 w-3.5" />
                          Receipt after the event
                        </>
                      )}
                    </span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t-2 border-outline-variant pt-2 font-bold text-on-surface">
                  <span>Season total</span>
                  <span>{formatCents(ledgerTotalCents)}</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Icon name="shield-check" className="h-4 w-4 shrink-0 text-success" />
                  Every expense traced to a receipt.
                </p>
              </div>
            </div>

            {/* Until-then card */}
            <div className="flex flex-col justify-center rounded-card bg-inverse-surface p-8 text-white shadow-sm">
              <Icon name="heart" className="mb-6 h-9 w-9 text-primary-container" />
              <h4 className="mb-4 font-display text-2xl font-bold">
                Until then, follow the journey.
              </h4>
              <p className="text-lg leading-relaxed text-white/80">
                The runners you follow today are the ones you&rsquo;ll be able to back tomorrow —
                and they&rsquo;ll see you in their corner from day one.
              </p>
              <Link
                href="/support"
                className="label-bold mt-6 inline-flex w-fit items-center gap-2 rounded-button bg-primary-container px-6 py-3 text-on-primary transition-colors hover:bg-primary"
              >
                How backing will work
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Success Stories
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
                Real runners, real arcs — journeys unfolding on ARC right now.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-2">
            {successStories.map((story, index) => (
              <Reveal key={story.name} delay={index * 100} className="h-full">
                <div className="group h-full overflow-hidden rounded-card border border-outline-variant bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_-24px_rgba(0,0,0,0.28)]">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={story.image}
                      alt={story.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                <div className="p-8">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-2xl font-bold text-on-surface">
                        {story.name}
                      </h4>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {story.sport}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="label-bold text-on-surface-variant">Followers</p>
                      <p className="font-display text-xl font-bold text-on-surface">
                        {story.followers}
                      </p>
                    </div>
                  </div>
                  <p className="label-bold mb-4 inline-flex items-center gap-2 rounded-pill bg-surface-container-low px-3 py-1.5 text-on-surface">
                    <Icon name="medal" className="h-4 w-4 text-primary" />
                    {story.highlight}
                  </p>
                  <blockquote className="mb-6 border-l-4 border-primary pl-4 italic text-on-surface-variant">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>
                  <Link
                    href={story.href}
                    className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
                  >
                    Read Story
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-bright px-5 py-20 md:px-16">
        <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-inverse-surface p-12 text-center md:p-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-5xl">
              Ready to follow the next great story?
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-white/70">
              Runners are telling their whole arc on ARC — the comebacks, the 5 a.m. miles, the
              breakthroughs. Every follow puts someone in their corner.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/athletes"
                className="inline-flex items-center justify-center rounded-button bg-white px-10 py-4 text-sm font-bold text-inverse-surface transition-all hover:bg-white/90"
              >
                Discover runners
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-10 py-4 text-sm font-bold text-on-primary transition-all hover:bg-primary active:scale-95"
              >
                Start your story
              </Link>
            </div>
          </div>
        </div>
        </Reveal>
      </section>
    </>
  );
}
