import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatCents } from '@/lib/format';
import { TrendingAthletes, type TrendingAthlete } from '@/components/site/TrendingAthletes';

const img = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

const arcSteps: { number: string; title: string; body: string; icon: IconName }[] = [
  {
    number: '01',
    title: 'Build Your Profile',
    body: 'Connect your Strava, Instagram, and competition history to create a professional athlete resume.',
    icon: 'person-add',
  },
  {
    number: '02',
    title: 'Set Your Goals',
    body: 'Define your upcoming competitions and funding targets. Make your path to the podium clear.',
    icon: 'target',
  },
  {
    number: '03',
    title: 'Build Your Community',
    body: 'Share your journey with backers who see exactly where their support goes via transparency.',
    icon: 'groups',
  },
];

const trendingAthletes: TrendingAthlete[] = [
  {
    name: 'Cassandra de Winter',
    sport: 'Elite Endurance & Trail • Alberta, CAN',
    image: img('1502904550040-7534597429ae', 760),
    percent: 82,
    raisedCents: 1890000,
    backers: 312,
    href: '/athletes/cassandra-de-winter',
  },
  {
    name: 'Leo Vance',
    sport: 'Elite Lead & Bouldering • London, UK',
    image: img('1522163182402-834f871fd851', 760),
    percent: 64,
    raisedCents: 1230000,
    backers: 188,
    href: '/athletes',
  },
  {
    name: 'Prince Emeka',
    sport: 'IFBB Pro Bodybuilder • Toronto, CAN',
    image: img('1571019613454-1cb2f99b2d8b', 760),
    percent: 47,
    raisedCents: 890000,
    backers: 96,
    href: '/athletes',
  },
];

const whyArc: { title: string; body: string; icon: IconName; tone: 'primary' | 'secondary' | 'tertiary' }[] = [
  {
    title: 'Authentic Storytelling',
    body: 'A place for athletes to authentically share their full journey — past accomplishments, previous races, training stories, and upcoming competitions.',
    icon: 'edu',
    tone: 'primary',
  },
  {
    title: 'Fan Connection',
    body: 'A place where fans and followers can connect, follow, and feel like a real part of their athletic journey.',
    icon: 'heart',
    tone: 'secondary',
  },
  {
    title: 'Build Your Community',
    body: 'A place to grow your support network and turn followers into lifelong backers.',
    icon: 'groups',
    tone: 'tertiary',
  },
];

const ledgerLines = [
  { label: 'Coaching Fees', amountCents: 85000 },
  { label: 'Travel: Regionals', amountCents: 42000 },
  { label: 'Sports Nutrition', amountCents: 12500 },
];
const ledgerRemainingCents = 431000;

const successStories = [
  {
    name: 'Leo Vance',
    sport: 'Track & Field • USA',
    raisedCents: 3240000,
    image: img('1461896836934-ffe607ba8211', 900),
    href: '/athletes',
  },
  {
    name: 'Cassandra de Winter',
    sport: 'Ultramarathon • Canada',
    raisedCents: 1890000,
    image: img('1502904550040-7534597429ae', 900),
    href: '/athletes/cassandra-de-winter',
  },
];

const successQuote =
  'Arc bridged the gap between my training milestones and competition entry fees. I finally felt professional.';

const whyToneClasses: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary-container/20 text-tertiary',
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative flex h-[512px] w-full items-center overflow-hidden bg-inverse-surface md:h-[600px]">
        <div className="absolute inset-0 opacity-60">
          <Image
            src={img('1571008887538-b36bb32f4571', 1920)}
            alt="Elite athlete running a marathon"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">
              Your <span className="text-primary-container">athletic</span> journey. Your{' '}
              <span className="text-primary-container">Arc</span>. Told in one place.
            </h2>
            <p className="mb-10 mt-6 max-w-xl text-2xl font-bold text-white md:text-3xl">
              Because finish lines are only part of the story&hellip;
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-8 py-4 text-lg font-bold tracking-[0.05em] text-on-primary transition-all hover:bg-primary active:scale-95"
              >
                Build Your Story
              </Link>
              <Link
                href="/mission"
                className="inline-flex items-center justify-center gap-2 rounded-button border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold tracking-[0.05em] text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                Watch Mission Video
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TELL YOUR ARC */}
      <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-surface-container-low to-white py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-5 [background-image:radial-gradient(circle_at_center,_var(--color-primary)_1px,_transparent_1px)] [background-size:32px_32px]"
        />
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Tell Your Arc
            </h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              Your athletic career deserves a professional home. Launch your athlete profile in three
              simple steps designed for elite performance.
            </p>
          </div>

          <div className="mx-auto mb-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            {arcSteps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center rounded-card border border-outline-variant/30 bg-white/50 p-6 text-center"
              >
                <div className="relative mb-6">
                  <span className="absolute -left-4 -top-4 font-display text-2xl font-extrabold text-primary/20">
                    {step.number}
                  </span>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                    <Icon name={step.icon} className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="mb-3 font-display text-xl font-bold text-on-surface">{step.title}</h4>
                <p className="text-on-surface-variant">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-card bg-primary-container px-12 py-5 text-lg font-bold tracking-[0.05em] text-on-primary shadow-xl transition-all hover:-translate-y-1 hover:shadow-primary/25 active:scale-95"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* TRENDING ATHLETES */}
      <TrendingAthletes athletes={trendingAthletes} />

      {/* WHY ARC */}
      <section className="border-y border-outline-variant/30 bg-surface-container-lowest py-24">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Why Arc?
            </h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              Traditional funding is opaque and bureaucratic. We built Arc to create a direct line
              between the fans who care and the athletes who inspire.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
            {whyArc.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-card border border-outline-variant/50 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md md:items-start md:text-left"
              >
                <div
                  className={`mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${whyToneClasses[item.tone]}`}
                >
                  <Icon name={item.icon} className="h-7 w-7" />
                </div>
                <h5 className="mb-3 font-display text-xl font-bold text-on-surface">{item.title}</h5>
                <p className="leading-relaxed text-on-surface-variant">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSPARENCY BENTO */}
      <section className="border-y border-outline-variant bg-surface-container-low py-24">
        <div className="mx-auto mb-16 w-full max-w-[var(--spacing-container-max)] px-5 text-center md:px-16">
          <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
            World&rsquo;s most transparent crowdfunding platform
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            We&rsquo;re building the future of athletic support through data-driven transparency and
            next-generation community tools.
          </p>
        </div>
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Radical Transparency */}
            <div className="flex flex-col items-start gap-6 rounded-card border border-outline-variant bg-white p-8 shadow-sm md:flex-row">
              <div className="flex-1">
                <Icon name="bar-chart" className="mb-4 h-8 w-8 text-secondary" />
                <h4 className="mb-3 font-display text-xl font-bold text-on-surface">
                  Radical Transparency
                </h4>
                <p className="text-on-surface-variant">
                  Every dollar tracked. Every expense audited. See exactly how your contribution
                  fuels the athlete&rsquo;s journey through real-time expense ledgers and reporting.
                </p>
              </div>
              <div className="w-full rounded-input bg-surface-container p-4 text-sm md:w-64">
                <div className="mb-2 flex justify-between border-b border-outline-variant pb-2 font-bold">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {ledgerLines.map((line) => (
                  <div key={line.label} className="flex justify-between py-1">
                    <span>{line.label}</span>
                    <span className="text-secondary">&minus;{formatCents(line.amountCents)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-outline-variant pt-2 font-bold text-on-surface">
                  <span>Remaining Balance</span>
                  <span>{formatCents(ledgerRemainingCents)}</span>
                </div>
              </div>
            </div>

            {/* Direct Connection */}
            <div className="flex flex-col justify-center rounded-card border border-secondary bg-secondary p-8 text-white shadow-sm">
              <Icon name="hub" className="mb-6 h-9 w-9" />
              <h4 className="mb-4 font-display text-2xl font-bold">Direct Connection</h4>
              <p className="text-lg leading-relaxed text-white/90">
                Bypass the middleman. Your support goes directly to the athlete, creating a
                measurable impact that you can follow from training to the podium.
              </p>
            </div>

            {/* Measurable Impact */}
            <div className="rounded-card border border-outline-variant bg-white p-8 shadow-sm">
              <Icon name="insights" className="mb-4 h-8 w-8 text-primary" />
              <h4 className="mb-3 font-display text-xl font-bold text-on-surface">
                Measurable Impact
              </h4>
              <p className="text-on-surface-variant">
                We track performance metrics alongside funding. Witness the correlation between
                financial stability and athletic breakthroughs.
              </p>
            </div>

            {/* Professional Momentum */}
            <div className="flex flex-col items-center gap-6 rounded-card border border-outline-variant bg-white p-8 shadow-sm md:flex-row">
              <div className="flex-1">
                <h4 className="mb-3 font-display text-xl font-bold text-on-surface">
                  Professional Momentum
                </h4>
                <p className="text-on-surface-variant">
                  A disciplined environment that mirrors the precision of elite sports. No clutter,
                  just performance.
                </p>
              </div>
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border-4 border-secondary">
                <span className="pulse-live font-display text-lg font-bold text-secondary">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Success Stories
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Witness the real-world impact of radical transparency and direct fan support.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {successStories.map((story) => (
              <div
                key={story.name}
                className="overflow-hidden rounded-card border border-outline-variant bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-64">
                  <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
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
                      <p className="label-bold text-on-surface-variant">Raised</p>
                      <p className="font-display text-xl font-bold text-on-surface">
                        {formatCents(story.raisedCents)}
                      </p>
                    </div>
                  </div>
                  <blockquote className="mb-6 border-l-4 border-primary pl-4 italic text-on-surface-variant">
                    &ldquo;{successQuote}&rdquo;
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-bright px-5 py-20 md:px-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-inverse-surface p-12 text-center md:p-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-5xl">
              Ready to back the next champion?
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-white/70">
              Join over 15,000 backers who are changing the landscape of professional sports through
              radical transparency.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/athletes"
                className="inline-flex items-center justify-center rounded-button bg-white px-10 py-4 text-sm font-bold tracking-[0.05em] text-inverse-surface transition-all hover:bg-white/90"
              >
                Explore Athletes
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-10 py-4 text-sm font-bold tracking-[0.05em] text-on-primary transition-all hover:bg-primary active:scale-95"
              >
                Apply as Athlete
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type IconName =
  | 'person-add'
  | 'target'
  | 'groups'
  | 'edu'
  | 'heart'
  | 'bar-chart'
  | 'hub'
  | 'insights'
  | 'arrow';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    'person-add': (
      <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h12v-1c0-2.8 0-5-4-5Zm9-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" />
    ),
    target: (
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    ),
    groups: (
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3 0-6 1.5-6 4.5V20h8v-2.5c0-1.2.5-2.3 1.3-3.2A9.6 9.6 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .2 1.2 1 2 2.3 2 3.8V20h6v-2.5c0-3-3-4.5-6-4.5Z" />
    ),
    edu: (
      <path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm0 14L5 13.2v3.3l7 3.8 7-3.8v-3.3L12 17Z" />
    ),
    heart: (
      <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" />
    ),
    'bar-chart': <path d="M4 20V10h3v10H4Zm6.5 0V4h3v16h-3ZM17 20v-7h3v7h-3Z" />,
    hub: (
      <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-16 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 7.4l4.4 3.3-1.2 1.6L4.8 9 6 7.4Zm12 0L19.2 9l-4.4 3.3-1.2-1.6L18 7.4ZM9.2 13.7l1.2 1.6L6 18.6 4.8 17l4.4-3.3Zm5.6 0L19.2 17 18 18.6l-4.4-3.3 1.2-1.6Z" />
    ),
    insights: (
      <path d="m3.5 15 5-5 4 4 7-7L21 8.4 12.5 17l-4-4-3.6 3.6L3.5 15Z" />
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
  };

  const isStroke = name === 'arrow';
  return (
    <svg
      viewBox={isStroke ? '0 0 20 20' : '0 0 24 24'}
      fill={isStroke ? 'none' : 'currentColor'}
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
