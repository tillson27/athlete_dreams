import Image from 'next/image';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';
import { Badge, LiveDot } from '@/components/ui/Badge';
import { AthleteCard } from '@/components/site/AthleteCard';
import { mockAthletes } from '@/lib/mockAthletes';
import { formatCents } from '@/lib/format';

const trendingStats: Array<{ value: string; label: string; icon: 'trophy' | 'cash' | 'group' }> = [
  { value: '142', label: 'Dreams Funded', icon: 'trophy' },
  { value: '$2.4M+', label: 'Total Raised', icon: 'cash' },
  { value: '15,000+', label: 'Global Backers', icon: 'group' },
];

const whyFadPoints = [
  {
    title: 'Total Transparency',
    body: 'See exactly where your funds are allocated — from travel and coaching to equipment and recovery.',
    tone: 'secondary' as const,
    icon: 'eye' as const,
  },
  {
    title: 'Direct Connection',
    body: 'Access exclusive athlete content, progress updates, and post-event recaps as a verified backer.',
    tone: 'primary' as const,
    icon: 'link' as const,
  },
  {
    title: 'Verified Talent',
    body: 'Every athlete undergoes a rigorous background and performance verification before launching a campaign.',
    tone: 'tertiary' as const,
    icon: 'check' as const,
  },
];

export default function HomePage() {
  const featured = mockAthletes.slice(0, 4);
  const sampleLedger = mockAthletes[0]?.campaigns[0];

  return (
    <>
      {/* HERO */}
      <section className="relative flex w-full items-center overflow-hidden bg-inverse-surface">
        <div className="absolute inset-0 opacity-55">
          <Image
            src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface via-inverse-surface/70 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-24 md:px-16 md:py-40">
          <div className="max-w-3xl">
            <Badge tone="live" className="mb-6">
              <LiveDot tone="on-primary" />
              Live Funding
            </Badge>
            <h1 className="font-display text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              The world&rsquo;s most{' '}
              <span className="text-primary-container">transparent</span> athlete funding network.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Fueling the dreams of elite athletes through direct, trackable financial backing. Every dollar move is visible. Every milestone is celebrated.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton tone="primary" size="lg" href="/athletes" className="group">
                Back an Athlete
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </LinkButton>
              <LinkButton
                tone="ghost"
                size="lg"
                href="/how-it-works"
                className="!text-white !bg-white/10 hover:!bg-white/20 backdrop-blur-md ring-1 ring-inset ring-white/20"
              >
                Watch Mission Video
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING STRIP */}
      <section className="border-b border-outline-variant bg-surface-container-low py-6 md:py-8">
        <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] grid-cols-3 gap-4 px-5 md:gap-12 md:px-16">
          {trendingStats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-2 md:flex-row md:justify-center md:gap-4 ${
                i === 1 ? 'border-x border-outline-variant px-2' : ''
              }`}
            >
              <TrendingIcon name={stat.icon} className="h-6 w-6 text-primary md:h-7 md:w-7" />
              <div className="text-center md:text-left">
                <p className="font-display text-lg font-bold text-on-surface md:text-2xl">
                  {stat.value}
                </p>
                <p className="label-bold text-on-surface-variant text-[10px] md:text-xs">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRENDING ATHLETES — horizontal scroll */}
      <Section tone="surface" pad="lg">
        <div className="mb-12 flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="This Week"
            title="Trending athletes"
            description="Profiles gaining significant momentum this week."
          />
        </div>
        <div className="-mx-5 flex gap-6 overflow-x-auto px-5 pb-6 no-scrollbar md:-mx-16 md:px-16">
          {featured.map((athlete) => (
            <div key={athlete.athleteSlug} className="w-[320px] shrink-0 md:w-[380px]">
              <AthleteCard athlete={athlete} />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <LinkButton tone="ghost" href="/athletes" className="group">
            See the full directory
            <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </LinkButton>
        </div>
      </Section>

      {/* WHY FAD NETWORK */}
      <Section tone="surface-bright" pad="xl">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-balance text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              Why FAD Network?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-on-surface-variant">
              Traditional funding is opaque and bureaucratic. We built FAD to create a direct line between the fans who care and the athletes who inspire.
            </p>
            <div className="mt-12 space-y-8">
              {whyFadPoints.map((point) => (
                <div key={point.title} className="flex gap-6">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      point.tone === 'secondary'
                        ? 'bg-secondary-soft text-secondary'
                        : point.tone === 'primary'
                          ? 'bg-primary-soft text-primary'
                          : 'bg-surface-container text-tertiary'
                    }`}
                  >
                    <WhyIcon name={point.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="label-bold text-on-surface">{point.title}</h5>
                    <p className="mt-2 text-on-surface-variant">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="relative aspect-[3/4] overflow-hidden rounded-card card-lift">
                  <Image
                    src="https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=900&q=80"
                    alt="Athlete training"
                    fill
                    sizes="(max-width: 768px) 50vw, 300px"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-card bg-secondary p-6 text-white card-lift">
                  <p className="font-display text-3xl font-bold">150+</p>
                  <p className="label-bold mt-1 text-white/80">Active Athletes</p>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden rounded-card card-lift">
                  <Image
                    src="https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80"
                    alt="Athlete portrait"
                    fill
                    sizes="(max-width: 768px) 50vw, 300px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* THE FAD DIFFERENCE — 2x2 mosaic */}
      <Section tone="surface-low" pad="xl" className="border-y border-outline-variant">
        <div className="text-center">
          <SectionHeading
            eyebrow="The FAD Difference"
            title="Rejecting opaque models for a data-driven future of athletic support."
            align="center"
          />
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Radical Transparency w/ mock ledger */}
          <article className="card-lift flex flex-col gap-6 rounded-card border border-outline-variant bg-surface-container-lowest p-8 md:flex-row md:items-start">
            <div className="flex-1">
              <BarChartIcon className="mb-4 h-8 w-8 text-secondary" />
              <h4 className="font-display text-xl font-bold leading-tight">
                Radical Transparency
              </h4>
              <p className="mt-3 text-on-surface-variant">
                Every dollar tracked. Every expense audited. See exactly how your contribution fuels the athlete&rsquo;s journey through real-time expense ledgers.
              </p>
            </div>
            <div className="w-full rounded-card bg-surface-container-low p-4 text-xs md:w-64">
              <div className="mb-2 flex justify-between border-b border-outline-variant pb-2">
                <span className="font-bold text-on-surface">Item</span>
                <span className="font-bold text-on-surface">Amount</span>
              </div>
              {(sampleLedger?.costLines ?? []).slice(0, 3).map((line) => (
                <div key={line.label} className="flex justify-between py-1">
                  <span className="text-on-surface-variant">{line.label}</span>
                  <span className="font-semibold text-secondary">
                    -{formatCents(line.amountCents)}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-outline-variant pt-2">
                <span className="font-bold text-on-surface">Remaining</span>
                <span className="font-bold text-on-surface">
                  {sampleLedger
                    ? formatCents(sampleLedger.targetAmountCents - sampleLedger.raisedAmountCents)
                    : '$0'}
                </span>
              </div>
            </div>
          </article>

          {/* Direct Connection — secondary fill */}
          <article className="card-lift rounded-card border border-secondary bg-secondary p-8 text-white">
            <HubIcon className="mb-6 h-10 w-10" />
            <h4 className="font-display text-xl font-bold leading-tight">Direct Connection</h4>
            <p className="mt-3 text-lg leading-relaxed text-white/90">
              Bypass the middleman. Your support goes directly to the athlete, creating a measurable impact you can follow from training to the podium.
            </p>
          </article>

          {/* Measurable Impact */}
          <article className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
            <InsightsIcon className="mb-4 h-8 w-8 text-primary" />
            <h4 className="font-display text-xl font-bold leading-tight">Measurable Impact</h4>
            <p className="mt-3 text-on-surface-variant">
              We track performance metrics alongside funding. Witness the correlation between financial stability and athletic breakthroughs — race results, podium finishes, sponsorship pickups.
            </p>
          </article>

          {/* Professional Momentum */}
          <article className="card-lift flex items-center gap-6 rounded-card border border-outline-variant bg-surface-container-lowest p-8">
            <div className="flex-1">
              <h4 className="font-display text-xl font-bold leading-tight">
                Professional Momentum
              </h4>
              <p className="mt-3 text-on-surface-variant">
                A disciplined environment that mirrors the precision of elite sports. No clutter — just performance, signed off in receipts and updates.
              </p>
            </div>
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border-4 border-secondary">
              <span className="label-bold text-secondary text-base">LIVE</span>
            </div>
          </article>
        </div>
      </Section>

      {/* DARK CTA BANNER */}
      <Section tone="surface" pad="lg">
        <div className="relative overflow-hidden rounded-card bg-inverse-surface px-6 py-14 text-center md:px-20 md:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at center, #ff5f1f 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
              Ready to back the next champion?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              Join thousands of backers who are changing the landscape of professional sports through radical transparency.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkButton tone="inverse" size="lg" href="/athletes">
                Explore Athletes
              </LinkButton>
              <LinkButton tone="primary" size="lg" href="/sign-up">
                Apply as Athlete
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

/* ----- Inline icons (avoids loading Material Symbols web font) ----- */
function TrendingIcon({
  name,
  className,
}: {
  name: 'trophy' | 'cash' | 'group';
  className?: string;
}) {
  if (name === 'trophy') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M17 4V2H7v2H2v4a5 5 0 0 0 5 5 5 5 0 0 0 4 4.9V20H7v2h10v-2h-4v-2.1A5 5 0 0 0 17 13a5 5 0 0 0 5-5V4h-5ZM4 8V6h3v4a3 3 0 0 1-3-2Zm16 0a3 3 0 0 1-3 2V6h3v2Z" />
      </svg>
    );
  }
  if (name === 'cash') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M2 5h20v14H2V5Zm2 2v10h16V7H4Zm8 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 8a8 8 0 0 1 16 0Z" />
    </svg>
  );
}

function WhyIcon({
  name,
  className,
}: {
  name: 'eye' | 'link' | 'check';
  className?: string;
}) {
  if (name === 'eye') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === 'link') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
        <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
        <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-7h3v15h-3V6Zm5 4h3v11h-3V10Z" />
    </svg>
  );
}

function HubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path
        d="M6 7 10 11M18 7 14 11M6 17 10 13M18 17 14 13"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function InsightsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 20h18v2H3v-2Zm3-6 4-4 4 4 6-7V5l-6 7-4-4-6 6v3Z" />
    </svg>
  );
}
