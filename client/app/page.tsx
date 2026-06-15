import Image from 'next/image';
import Link from 'next/link';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';
import { Badge, LiveDot, VerifiedChip } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AthleteCard } from '@/components/site/AthleteCard';
import { mockAthletes } from '@/lib/mockAthletes';
import { formatCents, formatSport, daysUntil } from '@/lib/format';

const inlineProofPoints = [
  { value: '142', label: 'Dreams funded' },
  { value: '$2.4M', label: 'Routed to athletes' },
  { value: '100%', label: 'Receipts published' },
];

const howSteps = [
  {
    number: '01',
    title: 'Pick an athlete',
    body: 'Browse verified athletes by sport, values, and the specific event they are training for.',
  },
  {
    number: '02',
    title: 'See the receipt',
    body: 'Every campaign is itemized — flights, lodging, coaching, gear. No mystery line items.',
  },
  {
    number: '03',
    title: 'Follow the dream',
    body: 'Photos, race reports, and post-event recaps land in your inbox until the goal is crossed.',
  },
];

export default function HomePage() {
  const featured = mockAthletes[0];
  const featuredCampaign = featured.campaigns[0];
  const restOfRoster = mockAthletes.slice(1, 4);
  const featuredDaysLeft = featuredCampaign?.closesAt
    ? daysUntil(featuredCampaign.closesAt)
    : null;
  const featuredPercent = featuredCampaign
    ? Math.min(
        100,
        Math.round((featuredCampaign.raisedAmountCents / featuredCampaign.targetAmountCents) * 100)
      )
    : 0;

  return (
    <>
      {/* ============================================================ */}
      {/* HERO — editorial split. Athlete IS the proof. */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-surface">
        {/* ambient warmth — soft, off-screen color washes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary-soft/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-1/3 h-[460px] w-[460px] rounded-full bg-secondary-soft/60 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-[var(--spacing-container-max)] grid-cols-1 gap-12 px-5 pb-24 pt-16 md:grid-cols-12 md:gap-16 md:px-16 md:pb-32 md:pt-24 lg:gap-20">
          {/* LEFT — typography column */}
          <div className="relative z-10 md:col-span-7 md:pt-6">
            <div className="inline-flex items-center gap-2 rounded-pill border border-outline-variant/60 bg-surface-container-lowest/80 px-3 py-1.5 backdrop-blur">
              <span
                aria-hidden="true"
                className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-primary-container"
              />
              <span className="label-bold text-on-surface">
                4 campaigns funding right now
              </span>
            </div>

            <h1 className="mt-8 font-display text-balance text-5xl font-extrabold leading-[0.95] tracking-tight text-on-surface sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem]">
              Back the
              <br />
              <span className="text-primary">dream</span>, not
              <br />
              the middle&shy;man.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
              ARC routes your support directly to verified athletes — for a specific race, a specific
              flight, a specific pair of skis. You see the receipt. You see the result.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <LinkButton tone="primary" size="lg" href="/athletes" className="group">
                Find an athlete to back
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </LinkButton>
              <Link
                href="/how-it-works"
                className="label-bold inline-flex items-center gap-2 px-3 py-3 text-on-surface hover:text-primary"
              >
                How it works
                <ArrowGlyph className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* inline proof — earned, not stacked */}
            <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-6 border-t border-outline-variant/60 pt-8">
              {inlineProofPoints.map((point) => (
                <div key={point.label}>
                  <dt className="label-bold text-on-surface-variant">{point.label}</dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-on-surface md:text-4xl">
                    {point.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* RIGHT — featured athlete card. Real face, real ask. */}
          {featuredCampaign ? (
            <aside className="relative z-10 md:col-span-5">
              <Link
                href={`/athletes/${featured.athleteSlug}`}
                className="group relative block overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-outline-variant/50 transition-all duration-300 hover:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={featured.heroMediaUrl}
                    alt={`${featured.fullName} — ${formatSport(featured.primarySport)}`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* top-right chip */}
                  <div className="absolute right-5 top-5">
                    <Badge tone="live">
                      <LiveDot tone="on-primary" />
                      Funding now
                    </Badge>
                  </div>

                  {/* overlay — name + ask */}
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <div className="flex items-center gap-2">
                      <VerifiedChip />
                      <span className="label-bold text-white/90">
                        {formatSport(featured.primarySport)} · {featured.hometown}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-3xl font-bold leading-tight">
                      {featured.fullName}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/85">
                      {featuredCampaign.campaignTitle}
                    </p>
                  </div>
                </div>

                {/* progress + numbers panel */}
                <div className="p-6 md:p-7">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-display text-2xl font-bold text-on-surface">
                        {formatCents(featuredCampaign.raisedAmountCents)}
                      </p>
                      <p className="label-bold text-on-surface-variant">
                        raised of {formatCents(featuredCampaign.targetAmountCents)}
                      </p>
                    </div>
                    <span className="font-display text-3xl font-bold text-primary">
                      {featuredPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      raisedAmountCents={featuredCampaign.raisedAmountCents}
                      targetAmountCents={featuredCampaign.targetAmountCents}
                      variant="compact"
                    />
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-4">
                    <span className="label-bold text-on-surface-variant">
                      {featuredCampaign.supporterCount} backers
                    </span>
                    <span className="label-bold text-on-surface-variant">
                      {featuredDaysLeft !== null && featuredDaysLeft >= 0
                        ? `${featuredDaysLeft} days left`
                        : 'Ongoing'}
                    </span>
                    <span className="label-bold inline-flex items-center gap-1 text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                      Back
                      <ArrowGlyph className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* floating value chip — adds personality without clutter */}
              <div className="absolute -left-3 top-10 hidden rotate-[-6deg] rounded-2xl bg-inverse-surface px-4 py-2 text-white shadow-xl md:block">
                <p className="font-display text-sm font-bold">Tokyo Marathon</p>
                <p className="label-bold text-white/60">Feb · 2026</p>
              </div>
            </aside>
          ) : null}
        </div>

        {/* hairline to anchor the next section */}
        <div className="border-t border-outline-variant/60" />
      </section>

      {/* ============================================================ */}
      {/* NOW FUNDING — clean editorial roster (no carousel) */}
      {/* ============================================================ */}
      <Section tone="surface" pad="xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <SectionHeading
            eyebrow="Now funding"
            title="Real athletes. Specific asks."
            description="Each campaign is a single, named goal — a race, a camp, a season. No vague tip jars."
          />
          <LinkButton tone="ghost" href="/athletes" className="group self-start md:self-auto">
            See the full roster
            <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </LinkButton>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restOfRoster.map((athlete) => (
            <AthleteCard key={athlete.athleteSlug} athlete={athlete} />
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* THE RECEIPT — transparency as a designed object */}
      {/* ============================================================ */}
      <Section tone="surface-low" pad="xl">
        <div className="grid items-center gap-16 md:grid-cols-12 md:gap-20">
          <div className="md:col-span-6">
            <p className="label-bold text-primary">The receipt</p>
            <h2 className="mt-4 font-display text-balance text-4xl font-bold leading-[1.05] text-on-surface md:text-5xl lg:text-6xl">
              Every dollar
              <br />
              has a job.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-surface-variant">
              Traditional sport funding is a black box. ARC itemizes the campaign before it goes
              live — flights, lodging, coaching, gear, recovery. You back the specific line, and the
              athlete reports back when it&rsquo;s spent.
            </p>

            <ul className="mt-10 space-y-5">
              {[
                {
                  title: 'Itemized by the athlete',
                  body: 'No bundled "training expenses." Each line is its own ask, with a name and a number.',
                },
                {
                  title: 'Verified before launch',
                  body: 'Our review team checks budgets against typical costs for the sport and event.',
                },
                {
                  title: 'Reconciled after',
                  body: 'Post-event recaps include the actual spend and a thank-you to the backers who covered each line.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M16.7 5.7 8 14.4l-4.7-4.7 1.4-1.4L8 11.6l7.3-7.3 1.4 1.4z" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-display text-base font-bold text-on-surface">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-on-surface-variant">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <LinkButton tone="secondary" href="/how-it-works" className="group">
                Read our transparency promise
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </LinkButton>
            </div>
          </div>

          {/* THE RECEIPT OBJECT */}
          {featuredCampaign ? (
            <div className="md:col-span-6">
              <div className="relative mx-auto max-w-md">
                {/* paper edge shadow */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-x-3 -bottom-4 -top-3 rounded-[2rem] bg-on-surface/5 blur-2xl"
                />
                <article className="relative rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-outline-variant/60 md:p-10">
                  {/* receipt header */}
                  <div className="flex items-start justify-between border-b border-dashed border-outline-variant pb-5">
                    <div>
                      <p className="label-bold text-on-surface-variant">Campaign</p>
                      <p className="mt-1 font-display text-lg font-bold leading-tight text-on-surface">
                        {featuredCampaign.campaignTitle}
                      </p>
                    </div>
                    <Badge tone="live">
                      <LiveDot tone="on-primary" />
                      Live
                    </Badge>
                  </div>

                  {/* line items */}
                  <ul className="mt-6 space-y-4">
                    {featuredCampaign.costLines.map((line) => (
                      <li
                        key={line.label}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <span className="text-on-surface">{line.label}</span>
                        <span className="flex-1 border-b border-dotted border-outline-variant/80" />
                        <span className="font-display text-base font-bold text-on-surface">
                          {formatCents(line.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* totals */}
                  <div className="mt-6 border-t border-dashed border-outline-variant pt-5">
                    <div className="flex justify-between text-base">
                      <span className="label-bold text-on-surface-variant">Total ask</span>
                      <span className="font-display font-bold text-on-surface">
                        {formatCents(featuredCampaign.targetAmountCents)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-base">
                      <span className="label-bold text-on-surface-variant">Raised so far</span>
                      <span className="font-display font-bold text-primary">
                        {formatCents(featuredCampaign.raisedAmountCents)}
                      </span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar
                        raisedAmountCents={featuredCampaign.raisedAmountCents}
                        targetAmountCents={featuredCampaign.targetAmountCents}
                        variant="compact"
                      />
                    </div>
                  </div>

                  <p className="mt-6 text-center text-xs text-on-surface-variant">
                    Thank you to {featuredCampaign.supporterCount} backers · Verified by ARC
                  </p>
                </article>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      {/* ============================================================ */}
      {/* HOW IT WORKS — three steps, minimal */}
      {/* ============================================================ */}
      <Section tone="surface" pad="xl">
        <SectionHeading
          eyebrow="How it works"
          title="From browse to backed in under three minutes."
          align="center"
        />
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {howSteps.map((step) => (
            <li key={step.number} className="relative">
              <span className="font-display text-7xl font-extrabold leading-none text-primary-soft md:text-8xl">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold text-on-surface">
                {step.title}
              </h3>
              <p className="mt-3 text-on-surface-variant">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============================================================ */}
      {/* FINAL CTA — split, focused, two audiences */}
      {/* ============================================================ */}
      <Section tone="surface" pad="lg">
        <div className="grid overflow-hidden rounded-[2rem] ring-1 ring-inset ring-outline-variant/60 md:grid-cols-2">
          {/* Backers */}
          <div className="relative bg-inverse-surface p-10 text-white md:p-14">
            <p className="label-bold text-primary-container">For supporters</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Pick a dream worth backing.
            </h3>
            <p className="mt-4 max-w-md text-white/75">
              Browse athletes by sport, story, or the values you want to lift up.
            </p>
            <div className="mt-8">
              <LinkButton tone="inverse" size="lg" href="/athletes" className="group">
                Explore athletes
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </LinkButton>
            </div>
          </div>
          {/* Athletes */}
          <div className="relative bg-primary p-10 text-white md:p-14">
            <p className="label-bold text-white/70">For athletes</p>
            <h3 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
              Get your campaign live in a week.
            </h3>
            <p className="mt-4 max-w-md text-white/85">
              Tell us your event, your budget, and your story. We&rsquo;ll verify and launch.
            </p>
            <div className="mt-8">
              <LinkButton
                tone="inverse"
                size="lg"
                href="/sign-up"
                className="group !text-primary"
              >
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
