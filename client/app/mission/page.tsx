import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge, LiveDot, VerifiedChip } from '@/components/ui/Badge';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Our Mission',
  description:
    "FAD Network exists to close the athletic funding gap. Every dollar tracked, every milestone celebrated, every dream backed in the open.",
  openGraph: {
    title: "Our Mission · FAD Network",
    description:
      'A transparent funding network for the next generation of athletes. Three pillars, one promise — back the dream, not the middleman.',
  },
};

const trustStats = [
  { value: '98.4%', label: 'Funds reaching athletes (vs ~30% in legacy sponsorship)' },
  { value: '< 24h', label: 'From donation receipt to athlete payout via Stripe' },
  { value: '100%', label: 'Of campaigns publish itemized receipts after the event' },
];

const problems = [
  {
    tag: 'The shadow journey',
    title: 'Athletes have no home for the full story.',
    body: 'Posts are scattered across Strava, Instagram, and old highlight reels. Potential backers only see the finish line — never the 4 a.m. lifts, the second-job hours, the gear that broke at the wrong moment. Without a single source of truth, there is nothing to back.',
  },
  {
    tag: 'The trust gap',
    title: 'Opaque crowdfunding erodes donor confidence.',
    body: 'Generic tip jars and "support my journey" links leave supporters guessing. Where did the money go? Did the athlete actually compete? Without verification and receipts, even generous fans stop giving.',
  },
  {
    tag: 'The middleman tax',
    title: 'Federations, sponsors, and platforms keep most of the money.',
    body: 'In legacy sport funding, an athlete sees pennies on the dollar after fees, overhead, and gatekeepers. The people closest to the athlete — family, community, fans — are the most willing to give and the worst served by the system.',
  },
];

const pillars = [
  {
    eyebrow: 'Pillar 01',
    title: 'Crowdfunding',
    headline: 'Direct, transparent, line-by-line.',
    body: 'Athletes raise for one event, one trip, one piece of gear at a time. Every campaign is itemized — flights, lodging, coaching, entry fees — and every dollar is reconciled after the event. Supporters back specific dreams, not generic causes.',
    href: '/athletes',
    cta: 'Browse open campaigns',
    accent: 'primary',
  },
  {
    eyebrow: 'Pillar 02',
    title: 'Corporate sponsorship',
    headline: 'Brands find athletes whose values match theirs.',
    body: 'No agency middleman. Brands search FAD by sport, region, and values, then connect directly. Every athlete profile is verified — performance history, brand-safety review, audience composition — so partnerships are built on facts, not vibes.',
    href: '/brands',
    cta: 'Sponsor an athlete',
    accent: 'secondary',
  },
  {
    eyebrow: 'Pillar 03',
    title: 'Managed ambassador programs',
    headline: 'We run the program. You own the relationship.',
    body: 'FAD operates discovery, intake, contracting, and compliance for enterprise ambassador rosters. Your brand team focuses on the storytelling and ROI; we handle the operational floor underneath.',
    href: '/ambassadors',
    cta: 'See ambassador programs',
    accent: 'ink',
  },
] as const;

const transparencyLines = [
  { label: 'Race entry fee · Tokyo Marathon', amountCents: 32000 },
  { label: 'Flight — Toronto → Tokyo (economy)', amountCents: 168000 },
  { label: 'Lodging — 4 nights, race village', amountCents: 84000 },
  { label: 'Recovery & physio (pre-race week)', amountCents: 40000 },
  { label: 'Race-day nutrition & kit', amountCents: 12000 },
];

const verifiedSteps = [
  {
    number: '01',
    title: 'Identity & story',
    body: 'Government ID, social proof, and a written story that goes through editorial review. No anonymous campaigns.',
  },
  {
    number: '02',
    title: 'Career resume',
    body: 'Verified personal bests, race results, and accomplishments — pulled from federation databases, race timing, and connected wearables.',
  },
  {
    number: '03',
    title: 'Synced journey',
    body: 'Optional connections to Garmin, Strava, Apple Watch, and Coros so backers see training output, not just promises.',
  },
  {
    number: '04',
    title: 'Receipts after',
    body: 'Post-event recap with actual spend, race results, and a thank-you to each backer who covered each line item.',
  },
];

const patronTiers = [
  {
    name: 'Silent Fan',
    body: 'Follows the journey. Reads the updates. Costs nothing, builds the audience.',
  },
  {
    name: 'Active Follower',
    body: 'Likes, comments, shares race-day updates. Becomes part of the athlete\'s social proof.',
  },
  {
    name: 'Committed Backer',
    body: 'Funds specific line items. Receives donation receipts and post-event recaps.',
  },
  {
    name: 'Elite Patron',
    body: 'Year-round monthly support. Direct line to the athlete. First look at next season.',
  },
];

const roadmap = [
  {
    phase: 'Phase 01 · Foundation',
    status: 'In motion',
    items: [
      'Verified athlete profiles with performance stats',
      'Event-based crowdfunding with itemized receipts',
      'Stripe-powered direct payouts (sub-24h)',
      'Post-event reconciliation and recap updates',
    ],
  },
  {
    phase: 'Phase 02 · Institutional Hub',
    status: 'Building',
    items: [
      'Multi-athlete portfolio management for brands',
      'ROI analytics and impact reporting',
      'Tax-receipt workflow for charitable backers',
      'Ambassador program tooling',
    ],
  },
  {
    phase: 'Phase 03 · Global scale',
    status: 'On the roadmap',
    items: [
      'Cross-border payouts and multi-currency',
      'Federation partnerships across NSO networks',
      'Localized discovery and language support',
      'On-platform brand marketplace',
    ],
  },
];

export default function MissionPage() {
  return (
    <>
      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-inverse-surface text-white">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1800&q=70"
            alt="Athlete training under stadium lights"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/40 via-inverse-surface/70 to-inverse-surface" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-primary-container/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-secondary-container/25 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-28 pt-24 md:px-16 md:pb-36 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur">
            <LiveDot />
            <span className="label-bold text-white/85">Our Mission</span>
          </div>

          <h1 className="mt-8 max-w-4xl font-display text-balance text-5xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Back the next generation.
            <br />
            <span className="text-primary-container">Without the middlemen.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
            FAD Network is the world&rsquo;s most transparent funding platform for athletes. We bridge
            peak performance and the people who want to back it &mdash; with receipts, real stories, and
            zero opacity.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <LinkButton href="/athletes" tone="primary" size="lg" className="group">
              Find an athlete to back
              <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </LinkButton>
            <LinkButton href="/presentation" tone="inverse" size="lg" className="group">
              View the deck
              <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </LinkButton>
          </div>

          <dl className="mt-20 grid gap-8 border-t border-white/15 pt-10 sm:grid-cols-3">
            {trustStats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <dt className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  {stat.value}
                </dt>
                <dd className="max-w-xs text-sm leading-relaxed text-white/70">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WHY WE EXIST */}
      {/* ============================================================ */}
      <Section tone="surface" pad="xl">
        <div className="grid items-end gap-10 md:grid-cols-[1.1fr_1.4fr] md:gap-20">
          <div>
            <p className="label-bold text-primary">Why we exist</p>
            <h2 className="mt-4 font-display text-balance text-4xl font-bold leading-[1.05] text-on-surface md:text-5xl lg:text-6xl">
              The athletic funding system is broken in three predictable places.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-on-surface-variant md:text-xl">
            We talked to hundreds of athletes, hundreds of backers, and a handful of brands. The same three
            words came up over and over: <em className="not-italic font-semibold text-on-surface">scattered</em>,{' '}
            <em className="not-italic font-semibold text-on-surface">opaque</em>, and{' '}
            <em className="not-italic font-semibold text-on-surface">extractive</em>. FAD is the response.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {problems.map((problem, index) => (
            <article
              key={problem.tag}
              className="card-lift relative flex flex-col gap-4 rounded-card border border-outline-variant/60 bg-surface-container-lowest p-7 md:p-8"
            >
              <span className="font-display text-6xl font-extrabold text-primary-soft md:text-7xl">
                0{index + 1}
              </span>
              <p className="label-bold text-primary">{problem.tag}</p>
              <h3 className="font-display text-2xl font-bold leading-tight text-on-surface">
                {problem.title}
              </h3>
              <p className="text-on-surface-variant">{problem.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* THREE PILLARS */}
      {/* ============================================================ */}
      <Section tone="surface-low" pad="xl">
        <SectionHeading
          eyebrow="The three pillars"
          title="One network. Three jobs to do."
          description="FAD does not pretend to be a social network, a payments processor, or a sponsorship agency. It is the connective tissue between the athlete and the three audiences who fund their career."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-outline-variant/60 bg-surface-container-lowest p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)] md:p-10"
            >
              <div
                aria-hidden="true"
                className={
                  pillar.accent === 'primary'
                    ? 'absolute inset-x-0 top-0 h-1 bg-primary-container'
                    : pillar.accent === 'secondary'
                      ? 'absolute inset-x-0 top-0 h-1 bg-secondary'
                      : 'absolute inset-x-0 top-0 h-1 bg-inverse-surface'
                }
              />
              <p className="label-bold text-on-surface-variant">{pillar.eyebrow}</p>
              <h3 className="mt-4 font-display text-2xl font-bold text-on-surface">
                {pillar.title}
              </h3>
              <p className="mt-3 font-display text-xl font-bold leading-tight text-on-surface md:text-2xl">
                {pillar.headline}
              </p>
              <p className="mt-4 text-on-surface-variant">{pillar.body}</p>
              <Link
                href={pillar.href}
                className="label-bold mt-8 inline-flex items-center gap-2 text-primary transition-transform duration-200 group-hover:translate-x-1"
              >
                {pillar.cta}
                <ArrowGlyph className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-card border border-primary/20 bg-primary-soft/40 px-6 py-5 text-sm leading-relaxed text-on-primary-container md:px-8 md:py-6 md:text-base">
          <span className="font-semibold">Anchor on Pillar 01.</span> Crowdfunding is our wedge — it is
          the daily flywheel, the source of public trust, and the proof point that earns the right to ship
          sponsorship and ambassador tooling.
        </div>
      </Section>

      {/* ============================================================ */}
      {/* RADICAL TRANSPARENCY — THE RECEIPT */}
      {/* ============================================================ */}
      <Section tone="surface" pad="xl">
        <div className="grid items-center gap-16 md:grid-cols-12 md:gap-20">
          <div className="md:col-span-6">
            <p className="label-bold text-primary">Radical transparency</p>
            <h2 className="mt-4 font-display text-balance text-4xl font-bold leading-[1.05] text-on-surface md:text-5xl lg:text-6xl">
              Every dollar has a name and a job.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-surface-variant">
              Traditional sport funding is a black box. FAD itemizes the campaign before it goes live and
              reconciles it after the athlete competes. The receipt is the product.
            </p>

            <ul className="mt-10 space-y-5">
              {[
                {
                  title: 'Itemized by the athlete',
                  body: 'No bundled "training expenses." Each line is its own ask, with a name and a number — so backers can fund the line that matters to them.',
                },
                {
                  title: 'Verified before launch',
                  body: 'Our review team checks budgets against typical costs for the sport, the event, and the region. Anything anomalous gets flagged.',
                },
                {
                  title: 'Reconciled after the event',
                  body: 'Post-event recaps include the actual spend, OCR-verified receipts where applicable, and a thank-you to the backers who covered each line.',
                },
                {
                  title: 'Public ledger, not a black box',
                  body: 'Every campaign carries a live ledger. Backers can see what has been spent, what is queued, and what is still raising.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M16.7 5.7 8 14.4l-4.7-4.7 1.4-1.4L8 11.6l7.3-7.3 1.4 1.4z" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-display text-base font-bold text-on-surface">{item.title}</h4>
                    <p className="mt-1 text-on-surface-variant">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-6">
            <div className="relative mx-auto max-w-md">
              <div
                aria-hidden="true"
                className="absolute -inset-x-3 -bottom-4 -top-3 rounded-[2rem] bg-on-surface/5 blur-2xl"
              />
              <article className="relative rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-outline-variant/60 md:p-10">
                <div className="flex items-start justify-between border-b border-dashed border-outline-variant pb-5">
                  <div>
                    <p className="label-bold text-on-surface-variant">Sample campaign</p>
                    <p className="mt-1 font-display text-lg font-bold leading-tight text-on-surface">
                      Get me to Tokyo Marathon 2026
                    </p>
                  </div>
                  <Badge tone="live">
                    <LiveDot tone="on-primary" />
                    Live
                  </Badge>
                </div>

                <ul className="mt-6 space-y-4">
                  {transparencyLines.map((line) => (
                    <li key={line.label} className="flex items-baseline justify-between gap-4">
                      <span className="text-on-surface">{line.label}</span>
                      <span className="flex-1 border-b border-dotted border-outline-variant/80" />
                      <span className="font-display text-base font-bold text-on-surface">
                        ${(line.amountCents / 100).toLocaleString('en-US')}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-dashed border-outline-variant pt-5">
                  <div className="flex justify-between text-base">
                    <span className="label-bold text-on-surface-variant">Total ask</span>
                    <span className="font-display font-bold text-on-surface">$3,360</span>
                  </div>
                  <div className="mt-2 flex justify-between text-base">
                    <span className="label-bold text-on-surface-variant">Raised so far</span>
                    <span className="font-display font-bold text-primary">$1,840</span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-container">
                      <div
                        className="progress-gradient h-full rounded-pill"
                        style={{ width: '55%' }}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-on-surface-variant">
                  Verified by FAD · 48 backers · 12 days remaining
                </p>
              </article>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* VERIFIED PERFORMER STANDARD */}
      {/* ============================================================ */}
      <Section tone="inverse" pad="xl">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div>
            <p className="label-bold text-primary-container">The Verified Performer Standard</p>
            <h2 className="mt-4 font-display text-balance text-4xl font-bold leading-[1.05] text-white md:text-5xl lg:text-6xl">
              An athlete profile, built like a financial record.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-white/75 md:text-xl">
            Every athlete on FAD passes through a four-step verification protocol before they can raise.
            The bar is high on purpose &mdash; supporters and brands need to trust what they see, and athletes
            who pass deserve to stand out from the noise.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {verifiedSteps.map((step) => (
            <li
              key={step.number}
              className="group rounded-card border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-all duration-300 hover:border-primary-container/60 hover:bg-white/[0.07]"
            >
              <span className="font-display text-5xl font-extrabold text-primary-container/80 md:text-6xl">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col items-start gap-6 rounded-card border border-white/15 bg-white/[0.04] p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-center gap-4">
            <VerifiedChip label="Verified Performer" />
            <p className="text-base text-white/80">
              The verified chip is not decoration. It is a signal that this athlete passed every step.
            </p>
          </div>
          <LinkButton href="/sign-up" tone="primary" size="md" className="group">
            Apply as an athlete
            <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </LinkButton>
        </div>
      </Section>

      {/* ============================================================ */}
      {/* SPECTATORS TO STAKEHOLDERS */}
      {/* ============================================================ */}
      <Section tone="surface-low" pad="xl">
        <div className="grid items-end gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <SectionHeading
            eyebrow="From spectators to stakeholders"
            title="A relationship, not a transaction."
            description="The most valuable supporter is not the one who gives the most once. It is the one who shows up next season, and the one after that. FAD is designed for that long arc."
          />
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {patronTiers.map((tier, index) => (
            <div
              key={tier.name}
              className="relative flex h-full flex-col gap-3 rounded-card border border-outline-variant/60 bg-surface-container-lowest p-6 md:p-7"
            >
              <span className="label-bold text-on-surface-variant">Tier 0{index + 1}</span>
              <h3 className="font-display text-2xl font-bold text-on-surface">{tier.name}</h3>
              <p className="text-on-surface-variant">{tier.body}</p>
              <div
                aria-hidden="true"
                className={
                  index === patronTiers.length - 1
                    ? 'mt-auto h-1 w-full rounded-pill bg-primary-container'
                    : 'mt-auto h-1 w-full rounded-pill bg-outline-variant/60'
                }
              />
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-on-surface-variant md:text-base">
          The supporter relationship moves up the ladder naturally as the athlete tells their story. Our job is
          not to push the ask &mdash; it is to make sure every interaction earns the next one.
        </p>
      </Section>

      {/* ============================================================ */}
      {/* ROADMAP */}
      {/* ============================================================ */}
      <Section tone="surface" pad="xl">
        <SectionHeading
          eyebrow="The roadmap"
          title="How we get from launch to a global network."
          description="A three-phase build, sequenced so each release earns the right to ship the next."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {roadmap.map((phase, index) => (
            <article
              key={phase.phase}
              className="relative flex h-full flex-col gap-5 rounded-card border border-outline-variant/60 bg-surface-container-lowest p-7 md:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="label-bold text-primary">{phase.phase}</span>
                <Badge tone={index === 0 ? 'live' : 'soft'}>
                  {index === 0 ? <LiveDot tone="on-primary" /> : null}
                  {phase.status}
                </Badge>
              </div>
              <div className="h-1 w-12 rounded-pill bg-primary-container" />
              <ul className="space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-on-surface-variant">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-1 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    >
                      <path d="M16.7 5.7 8 14.4l-4.7-4.7 1.4-1.4L8 11.6l7.3-7.3 1.4 1.4z" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* PRINCIPLES STRIP */}
      {/* ============================================================ */}
      <Section tone="surface-low" pad="lg">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            {
              title: 'Transparency over polish',
              body: 'A messy training log beats a glossy promo video. Authenticity is the moat.',
            },
            {
              title: 'Story before metrics',
              body: 'The athlete\'s name, sport, and reason for racing come before the dollar amount.',
            },
            {
              title: 'Athlete-first economics',
              body: 'Direct Stripe payouts. No platform skim that should belong to the person training.',
            },
          ].map((principle) => (
            <div key={principle.title} className="space-y-3">
              <div className="h-px w-12 bg-primary-container" />
              <h3 className="font-display text-2xl font-bold text-on-surface">{principle.title}</h3>
              <p className="text-on-surface-variant">{principle.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* CTA SPLIT */}
      {/* ============================================================ */}
      <Section tone="surface" pad="lg">
        <div className="grid overflow-hidden rounded-[2rem] ring-1 ring-inset ring-outline-variant/60 md:grid-cols-2">
          <div className="relative bg-inverse-surface p-10 text-white md:p-14">
            <p className="label-bold text-primary-container">For supporters</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Pick a dream worth backing.
            </h3>
            <p className="mt-4 max-w-md text-white/75">
              Browse athletes by sport, story, or the values you want to lift up. Every campaign shows the math.
            </p>
            <div className="mt-8">
              <LinkButton href="/athletes" tone="inverse" size="lg" className="group">
                Explore athletes
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </LinkButton>
            </div>
          </div>
          <div className="relative bg-primary p-10 text-white md:p-14">
            <p className="label-bold text-white/70">For athletes</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Get your campaign live in a week.
            </h3>
            <p className="mt-4 max-w-md text-white/85">
              Tell us your event, your budget, and your story. We&rsquo;ll verify and launch.
            </p>
            <div className="mt-8">
              <LinkButton href="/sign-up" tone="inverse" size="lg" className="group !text-primary">
                Apply as an athlete
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
