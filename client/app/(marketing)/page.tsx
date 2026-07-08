import Image from 'next/image';
import Link from 'next/link';
import { formatCents } from '@/lib/format';
import { TrendingAthletes, type TrendingAthlete } from '@/components/site/TrendingAthletes';
import { Reveal } from '@/components/site/Reveal';
import { unsplashPhoto as img } from '@/lib/unsplash';
import { Icon, type IconName } from '@/components/ui/Icon';

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
    name: 'Félix Tremblay',
    sport: 'Para Road Racing • Canada',
    raisedCents: 2475000,
    image: img('1508973379184-7517410fb0bc', 900),
    href: '/athletes/felix-tremblay',
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
  primary: 'bg-primary-container/15 text-primary-container',
  secondary: 'bg-secondary/20 text-secondary-fixed-dim',
  tertiary: 'bg-white/10 text-white',
};

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
            className="ken-burns object-cover"
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
            <h1 className="font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-sm md:text-6xl">
              Your <span className="text-primary-container">athletic</span> journey. Your{' '}
              <span className="text-primary-container">Arc</span>. Told in one place.
            </h1>
            <p className="mb-10 mt-6 max-w-xl text-2xl font-bold text-white/90 md:text-3xl">
              Because finish lines are only part of the story&hellip;
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-8 py-4 text-lg font-bold tracking-[0.05em] text-on-primary shadow-lg shadow-primary-container/25 transition-all hover:-translate-y-0.5 hover:bg-primary active:scale-95"
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
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* TRENDING ATHLETES */}
      <TrendingAthletes athletes={trendingAthletes} />

      {/* WHY ARC — dark band for rhythm */}
      <section className="relative overflow-hidden border-y border-white/5 bg-inverse-surface py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:34px_34px]"
        />
        <div className="relative mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <p className="mb-3 label-bold text-primary-container">Why Arc</p>
              <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-5xl">
                A direct line between fans and athletes.
              </h2>
              <p className="text-lg leading-relaxed text-white/70">
                Traditional funding is opaque and bureaucratic. We built Arc to create a direct line
                between the fans who care and the athletes who inspire.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
            {whyArc.map((item, index) => (
              <Reveal key={item.title} delay={index * 90} className="h-full">
                <div className="group flex h-full flex-col items-center rounded-card border border-white/10 bg-white/[0.04] p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.07] hover:shadow-[0_28px_55px_-22px_rgba(255,95,31,0.4)] md:items-start md:text-left">
                  <div
                    className={`mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${whyToneClasses[item.tone]}`}
                  >
                    <Icon name={item.icon} className="h-7 w-7" />
                  </div>
                  <h5 className="mb-3 font-display text-xl font-bold text-white">{item.title}</h5>
                  <p className="leading-relaxed text-white/70">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSPARENCY BENTO */}
      <section className="border-y border-outline-variant bg-surface-container-low py-24">
        <Reveal>
          <div className="mx-auto mb-16 w-full max-w-[var(--spacing-container-max)] px-5 text-center md:px-16">
            <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
              World&rsquo;s most transparent crowdfunding platform
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              We&rsquo;re building the future of athletic support through data-driven transparency
              and next-generation community tools.
            </p>
          </div>
        </Reveal>
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
          <Reveal>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Success Stories
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
                Witness the real-world impact of radical transparency and direct fan support.
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
        </Reveal>
      </section>
    </>
  );
}
