import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import { Icon, type IconName } from '@/components/ui/Icon';
import { unsplashPhoto as img } from '@/lib/unsplash';
import { profileUrl } from '@/lib/profileUrl';

export const metadata: Metadata = {
  title: 'For Athletes — Your professional running home',
  description:
    'Every runner has a story worth telling. ARC is the professional home for your running journey — your races, milestones, and community. Whatever your pace.',
};

const pillars: { icon: IconName; title: string; body: string; tone: string }[] = [
  {
    icon: 'book',
    title: 'Tell the whole story',
    tone: 'bg-primary/10 text-primary',
    body: 'Your comeback, your training, the race that broke you and the one that made you. Not just a finish time — the human behind it.',
  },
  {
    icon: 'shield',
    title: 'Look the part',
    tone: 'bg-secondary/10 text-secondary',
    body: 'A verified, professional profile — with results synced from Strava and official race databases — that makes your running count, whether you run for medals or just for yourself.',
  },
  {
    icon: 'groups',
    title: 'Bring people along',
    tone: 'bg-primary/10 text-primary',
    body: 'The friends, family, and fellow runners who want to follow your journey — gathered in one place that’s truly yours.',
  },
];

const personas = [
  { label: 'The first-timer', image: '1517836357463-d25dfeac3438' },
  { label: 'Lunch-break miles', image: '1571902943202-507ec2618e8f' },
  { label: 'The comeback', image: '1502904550040-7534597429ae' },
  { label: 'Trail & ultra', image: '1476480862126-209bfaa8edc8' },
  { label: 'Amateur-elite', image: '1461896836934-ffe607ba8211' },
];

const steps = [
  {
    number: '01',
    title: 'Build your profile',
    body: 'Add your photo, a short bio, and where you’re headed next. Looks professional from the first minute.',
  },
  {
    number: '02',
    title: 'Tell your story',
    body: 'Races, PRs, milestones, and the why behind them — with guided prompts, so you never stare at a blank page.',
  },
  {
    number: '03',
    title: 'Bring your community',
    body: 'Share your profile and let the people who care about your running follow every step of the journey.',
  },
];

const comparisons = [
  {
    old: 'Instagram',
    oldBody: 'Your best race scrolls out of sight within a day.',
    arc: 'A permanent home for your journey — the first thing people see.',
  },
  {
    old: 'Strava',
    oldBody: 'Splits and pace. The numbers, none of the meaning.',
    arc: 'The story behind the numbers — why each run mattered.',
  },
  {
    old: 'A link in bio',
    oldBody: 'A name and a PR on a plain, forgettable page.',
    arc: 'Verified, professional, and unmistakably yours.',
  },
];

export default function ForAthletesPage() {
  return (
    <>
      <section className="relative flex min-h-[560px] items-center overflow-hidden bg-inverse-surface md:min-h-[640px]">
        <div className="absolute inset-0 opacity-55">
          <Image
            src={img('1571008887538-b36bb32f4571', 1920)}
            alt="A runner mid-stride"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#140b08]/90 via-[#160d09]/60 to-[#160d09]/25"
        />
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <div className="max-w-3xl">
            <span className="label-bold inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/10 px-3.5 py-1.5 text-white backdrop-blur">
              For runners
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white md:text-6xl">
              Every run is part of a bigger story. Give yours a home.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
              From your first half-marathon to your hundredth podium, ARC is the professional home
              for your running journey — your races, your milestones, your people. Whatever your
              pace.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-button bg-primary-container px-8 py-4 text-base font-bold tracking-[0.05em] text-on-primary shadow-lg shadow-primary-container/25 transition-all hover:-translate-y-0.5 hover:bg-primary active:scale-95"
              >
                Build your profile
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="/athletes/cassandra-de-winter"
                className="inline-flex items-center justify-center gap-2 rounded-button border border-white/20 bg-white/10 px-8 py-4 text-base font-bold tracking-[0.05em] text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                See a live example
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/60">Free while we’re in pilot · no team required</p>
          </div>
        </div>
      </section>
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="label-bold text-primary">Why runners join</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Built for your story, not your stats.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                Instagram forgets. Spreadsheets are cold. ARC is a home that treats your running like
                it matters — because it does.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 90} className="h-full">
                <div className="group flex h-full flex-col rounded-card border border-outline-variant/50 bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_50px_-24px_rgba(171,54,0,0.35)]">
                  <span
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${pillar.tone} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon name={pillar.icon} className="h-7 w-7" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-on-surface">{pillar.title}</h3>
                  <p className="mt-3 leading-relaxed text-on-surface-variant">{pillar.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-outline-variant bg-surface-container-low py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="label-bold text-primary">Your professional home</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-on-surface md:text-5xl">
                A profile you’ll be proud to share.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                Not a directory listing — an editorial home for who you are as a runner. Here’s a
                real one; yours could look just as good.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface-container-lowest shadow-2xl">
              <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-error/70" />
                <span className="h-3 w-3 rounded-full bg-primary-container/70" />
                <span className="h-3 w-3 rounded-full bg-success/70" />
                <span className="ml-3 flex-1 truncate rounded-pill bg-surface px-3 py-1 text-xs text-on-surface-variant">
                  {profileUrl('cassandra-de-winter')}
                </span>
              </div>
              <div>
                <div className="relative h-56 md:h-64">
                  <Image
                    src={img('1502904550040-7534597429ae', 1200)}
                    alt="Cassandra de Winter's ARC profile"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-pill bg-success px-2.5 py-1 text-[11px] font-bold tracking-[0.05em]">
                      <Icon name="check-badge" className="h-3.5 w-3.5" />
                      Verified Athlete
                    </span>
                    <h3 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
                      Cassandra de Winter
                    </h3>
                    <p className="label-bold mt-1 text-white/90">
                      Elite Endurance &amp; Trail · Lethbridge, AB
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-3">
                  <div className="rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">Marathon PB</p>
                    <p className="font-display text-xl font-bold text-on-surface">2:34:43</p>
                  </div>
                  <div className="rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">Next up</p>
                    <p className="font-display text-lg font-bold text-on-surface">
                      Lost Soul 100-miler
                    </p>
                  </div>
                  <div className="rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">Followers</p>
                    <p className="font-display text-xl font-bold text-on-surface">12.4k</p>
                  </div>
                  <div className="sm:col-span-3">
                    <p className="border-l-4 border-primary pl-4 italic text-on-surface-variant">
                      “I run to show my kids what chasing something wholeheartedly looks like.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              A real ARC profile —{' '}
              <span className="font-semibold text-on-surface">Cassandra de Winter</span>. Yours could
              look just as good.
            </p>
            <Link
              href="/athletes/cassandra-de-winter"
              className="mt-2 inline-flex items-center gap-2 font-bold text-primary hover:underline"
            >
              View the full profile
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="label-bold text-primary">Why ARC</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-on-surface md:text-5xl">
                More than a bio link.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                Instagram is a highlight reel. Strava is a logbook. Your running deserves a home that
                holds the whole story — and looks the part.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {comparisons.map((comparison, index) => (
              <Reveal key={comparison.old} delay={index * 90} className="h-full">
                <div className="flex h-full flex-col rounded-card border border-outline-variant/50 bg-surface-container-lowest p-8">
                  <p className="font-semibold text-on-surface-variant/70 line-through">
                    {comparison.old}
                  </p>
                  <p className="mt-1 text-on-surface-variant">{comparison.oldBody}</p>
                  <div className="my-5 h-px bg-outline-variant/60" />
                  <p className="label-bold text-primary">On ARC</p>
                  <p className="mt-1 font-display text-lg font-bold text-on-surface">
                    {comparison.arc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="label-bold text-primary">You belong here</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Whatever kind of runner you are.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                ARC isn’t just for pros. Whether you’re logging lunch-break miles or lining up at the
                elite corral — if you run, you have a story worth a home.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
            {personas.map((persona, index) => (
              <Reveal key={persona.label} delay={index * 70}>
                <div className="group relative aspect-[3/4] overflow-hidden rounded-card">
                  <Image
                    src={img(persona.image, 500)}
                    alt={persona.label}
                    fill
                    sizes="(max-width: 768px) 50vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 font-display text-lg font-bold leading-tight text-white">
                    {persona.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-outline-variant bg-surface-container-low py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="label-bold text-primary">The glow-up</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-on-surface md:text-5xl">
                Fifteen minutes from a profile you’ll want to show off.
              </h2>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 90} className="h-full">
                <div className="flex h-full flex-col rounded-card border border-outline-variant/40 bg-surface-container-lowest p-8">
                  <span className="font-display text-5xl font-extrabold text-primary/20">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-on-surface-variant">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary-container px-10 py-4 text-base font-bold tracking-[0.05em] text-on-primary shadow-xl transition-all hover:-translate-y-1 hover:bg-primary active:scale-95"
            >
              Start your profile
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <blockquote className="font-display text-2xl font-bold leading-snug text-on-surface md:text-4xl">
                “ARC bridged the gap between my training and how I saw myself. I finally felt like a
                real runner.”
              </blockquote>
              <p className="mt-6 label-bold text-on-surface-variant">
                Cassandra de Winter · Endurance &amp; trail
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="flex -space-x-3">
                  {['CW', 'LV', 'PE', 'MO'].map((initials) => (
                    <span
                      key={initials}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-primary-container text-xs font-bold text-on-primary-container"
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-on-surface-variant">
                  Join the runners already making it home.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="bg-surface-bright px-5 py-20 md:px-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-inverse-surface p-12 text-center md:p-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-5xl">
              Your story deserves more than a finish time.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              Build your ARC profile in about 15 minutes — free while we’re in pilot.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-button bg-primary-container px-10 py-4 text-base font-bold tracking-[0.05em] text-on-primary transition-all hover:bg-primary active:scale-95"
              >
                Build your profile
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link
                href="/athletes"
                className="inline-flex items-center justify-center rounded-button bg-white/10 px-10 py-4 text-base font-bold tracking-[0.05em] text-white ring-1 ring-inset ring-white/20 transition-all hover:bg-white/20"
              >
                Browse runners first
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
