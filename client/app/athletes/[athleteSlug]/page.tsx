import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge, LiveDot, VerifiedChip } from '@/components/ui/Badge';
import { LinkButton, Button, ArrowGlyph } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCents, formatSport, daysUntil } from '@/lib/format';

export async function generateStaticParams() {
  return mockAthletes.map((athlete) => ({ athleteSlug: athlete.athleteSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}): Promise<Metadata> {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  if (!athlete) return { title: 'Athlete not found' };
  return {
    title: `${athlete.fullName} · ${formatSport(athlete.primarySport)}`,
    description: athlete.headline,
  };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  if (!athlete) notFound();

  return (
    <>
      {/* HERO — full-bleed dark photo with status chips and athlete identity */}
      <section className="relative overflow-hidden bg-inverse-surface text-white">
        <div className="absolute inset-0 opacity-60">
          <Image
            src={athlete.heroMediaUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface via-inverse-surface/70 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-16 md:px-16 md:py-24">
          <Link
            href="/athletes"
            className="label-bold inline-flex items-center gap-1 text-white/80 hover:text-primary-container"
          >
            <ArrowGlyph className="h-3.5 w-3.5 rotate-180" />
            Back to directory
          </Link>
          <div className="mt-6 max-w-3xl space-y-5">
            <div className="flex flex-wrap gap-2">
              {athlete.activeCampaignCount > 0 ? (
                <Badge tone="live">
                  <LiveDot />
                  Live Funding
                </Badge>
              ) : null}
              <VerifiedChip label="Verified Athlete" />
            </div>
            <h1 className="font-display text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {athlete.fullName}
            </h1>
            <p className="label-bold text-primary-container">
              {formatSport(athlete.primarySport)} • {athlete.hometown}
            </p>
            <p className="max-w-2xl text-lg leading-relaxed text-white/85">{athlete.headline}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <LinkButton tone="primary" size="lg" href="#donate">
                Back this athlete
              </LinkButton>
              <LinkButton
                tone="ghost"
                size="lg"
                href="#story"
                className="!text-white !bg-white/10 hover:!bg-white/20 backdrop-blur-md ring-1 ring-inset ring-white/20"
              >
                Read the story
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY STAT STRIP */}
      <section className="border-b border-outline-variant bg-surface-container-low py-6">
        <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] grid-cols-2 gap-4 px-5 md:grid-cols-4 md:gap-12 md:px-16">
          <StripStat label="Total Raised" value={formatCents(athlete.totalRaisedCents)} />
          <StripStat label="Active Campaigns" value={String(athlete.activeCampaignCount)} />
          <StripStat
            label="Backers"
            value={String(
              athlete.campaigns.reduce((sum, campaign) => sum + campaign.supporterCount, 0)
            )}
          />
          <StripStat label="Open to Brands" value="Yes — aligned" />
        </div>
      </section>

      {/* STORY + VALUES */}
      <Section id="story" tone="surface-bright" pad="lg">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <SectionHeading eyebrow="About" title={`Meet ${athlete.fullName.split(' ')[0]}`} />
            <p className="text-lg leading-relaxed text-on-surface-variant">{athlete.bio}</p>
            <div className="flex flex-wrap gap-2 pt-4">
              {athlete.values.map((value) => (
                <Badge key={value} tone="secondary-soft">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="label-bold text-on-surface">Accomplishments</h3>
            <ul className="space-y-3">
              {athlete.accomplishments.map((accomplishment) => (
                <li
                  key={accomplishment.title}
                  className="flex items-baseline justify-between rounded-card border border-outline-variant bg-surface-container-lowest px-5 py-4"
                >
                  <span className="text-sm text-on-surface">{accomplishment.title}</span>
                  <span className="font-display text-lg font-bold text-on-surface-variant">
                    {accomplishment.year}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* CAMPAIGNS — transparency ledger */}
      <Section tone="surface-low" pad="lg" className="border-y border-outline-variant">
        <SectionHeading
          eyebrow="Active campaigns"
          title="Fund a specific dream"
          description="Every campaign is itemized by the athlete. Donate to the line you care about most, or back the whole thing."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {athlete.campaigns.map((campaign) => {
            const totalLines = campaign.costLines.reduce(
              (sum, line) => sum + line.amountCents,
              0
            );
            const days = campaign.closesAt ? daysUntil(campaign.closesAt) : null;
            return (
              <article
                key={campaign.campaignSlug}
                className="card-lift flex flex-col gap-6 rounded-card border border-outline-variant bg-surface-container-lowest p-7 md:p-8"
              >
                <header className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="primary-soft">{formatSport(campaign.campaignType)}</Badge>
                    {days !== null ? (
                      <span className="label-bold text-on-surface-variant">
                        {days >= 0 ? `${days} days left` : 'Closed'}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    {campaign.campaignTitle}
                  </h3>
                  <p className="text-on-surface-variant">{campaign.campaignStory}</p>
                </header>
                <ProgressBar
                  raisedAmountCents={campaign.raisedAmountCents}
                  targetAmountCents={campaign.targetAmountCents}
                  supporterCount={campaign.supporterCount}
                  daysLeft={days ?? undefined}
                />
                <div>
                  <p className="label-bold text-on-surface">Cost Breakdown</p>
                  <ul className="mt-4 divide-y divide-outline-variant/60 rounded-card border border-outline-variant bg-surface-container-low">
                    {campaign.costLines.map((line) => (
                      <li
                        key={line.label}
                        className="flex items-center justify-between px-5 py-3 text-sm"
                      >
                        <span className="text-on-surface">{line.label}</span>
                        <span className="font-semibold text-secondary">
                          {formatCents(line.amountCents)}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between border-t border-outline-variant px-5 py-3">
                      <span className="label-bold text-on-surface">Total Target</span>
                      <span className="font-display text-lg font-bold text-on-surface">
                        {formatCents(totalLines)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <LinkButton tone="primary" href={`#donate`}>
                    Back this campaign
                  </LinkButton>
                  <Button tone="secondary">Share</Button>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* DONATE CTA */}
      <Section id="donate" tone="surface" pad="lg">
        <div className="relative overflow-hidden rounded-card bg-inverse-surface px-6 py-14 text-white md:px-20 md:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at center, #0453cd 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <Badge tone="primary-soft">Direct to athlete</Badge>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                Back {athlete.fullName.split(' ')[0]}&rsquo;s next race.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-white/80">
                Donations move directly to {athlete.fullName.split(' ')[0]} after a 3% platform fee. You&rsquo;ll get a receipt, a thank-you note, and a post-event update with photos and results.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <LinkButton href="/sign-in" tone="primary" size="lg">
                  Donate
                </LinkButton>
                <LinkButton
                  href="/brands"
                  tone="ghost"
                  size="lg"
                  className="!text-white hover:!bg-white/15"
                >
                  I&rsquo;m a brand — let&rsquo;s talk →
                </LinkButton>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                '3% platform fee. No payout freezes.',
                'Itemized cost breakdown the athlete wrote.',
                'Post-event recap so you see your gift land.',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-card bg-white/8 p-4 ring-1 ring-inset ring-white/15"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-primary-container text-xs font-bold text-on-primary">
                    ✓
                  </span>
                  <span className="text-white/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}

function StripStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="label-bold text-on-surface-variant">{label}</span>
      <span className="font-display text-2xl font-bold text-on-surface md:text-3xl">{value}</span>
    </div>
  );
}
