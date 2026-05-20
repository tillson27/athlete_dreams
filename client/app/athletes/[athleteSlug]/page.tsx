import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCents, formatSport } from '@/lib/format';

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
      <Section className="!pt-12">
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] bg-ink/10">
            <Image
              src={athlete.heroMediaUrl}
              alt={`${athlete.fullName}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
          </div>
          <div className="space-y-6">
            <Badge tone="flame">{formatSport(athlete.primarySport)}</Badge>
            <h1 className="font-display text-balance text-4xl leading-tight sm:text-5xl md:text-6xl">
              {athlete.fullName}
            </h1>
            <p className="text-lg text-ink/75">{athlete.headline}</p>
            <p className="text-base leading-relaxed text-ink/70">{athlete.bio}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {athlete.values.map((value) => (
                <Badge key={value} tone="soft">{value}</Badge>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink/10 pt-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/55">Hometown</dt>
                <dd className="text-ink">{athlete.hometown}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/55">Total raised</dt>
                <dd className="text-ink">{formatCents(athlete.totalRaisedCents)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/55">Active campaigns</dt>
                <dd className="text-ink">{athlete.activeCampaignCount}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/55">Open to brands</dt>
                <dd className="text-ink">Yes — aligned partnerships only</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      <Section className="bg-paper-soft border-y border-ink/5">
        <SectionHeading
          eyebrow="Active campaigns"
          title="Fund a specific dream"
          description="Every campaign is itemized by the athlete. Donate to the line you care about most, or back the whole thing."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {athlete.campaigns.map((campaign) => {
            const totalLines = campaign.costLines.reduce((sum, line) => sum + line.amountCents, 0);
            return (
              <article
                key={campaign.campaignSlug}
                className="flex flex-col gap-6 rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-inset ring-ink/5"
              >
                <header className="space-y-3">
                  <Badge tone="flame">{formatSport(campaign.campaignType)}</Badge>
                  <h3 className="font-display text-2xl leading-tight">{campaign.campaignTitle}</h3>
                  <p className="text-sm text-ink/75">{campaign.campaignStory}</p>
                </header>
                <ProgressBar
                  raisedAmountCents={campaign.raisedAmountCents}
                  targetAmountCents={campaign.targetAmountCents}
                  supporterCount={campaign.supporterCount}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
                    Cost breakdown
                  </p>
                  <ul className="mt-3 divide-y divide-ink/5 text-sm">
                    {campaign.costLines.map((line) => (
                      <li key={line.label} className="flex items-center justify-between py-2">
                        <span className="text-ink/80">{line.label}</span>
                        <span className="font-semibold text-ink">{formatCents(line.amountCents)}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between border-t border-ink/10 pt-3 text-xs text-ink/55">
                      <span>Total target</span>
                      <span>{formatCents(totalLines)}</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <LinkButton tone="primary" href={`/athletes/${athlete.athleteSlug}#donate`}>
                    Back this campaign
                  </LinkButton>
                  <LinkButton tone="secondary" href={`/athletes/${athlete.athleteSlug}#donate`}>
                    Share
                  </LinkButton>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            eyebrow="Resume"
            title="Accomplishments"
            description="Receipts. The athletes write these themselves."
          />
          <ul className="space-y-4">
            {athlete.accomplishments.map((accomplishment) => (
              <li
                key={accomplishment.title}
                className="flex items-baseline justify-between border-b border-ink/10 pb-4 text-sm"
              >
                <span className="text-ink">{accomplishment.title}</span>
                <span className="font-display text-lg text-ink/55">{accomplishment.year}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="!pt-0">
        <div id="donate" className="rounded-[var(--radius-card)] bg-ink px-6 py-10 text-paper sm:px-8 sm:py-12 md:px-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <h2 className="font-display text-4xl leading-tight">
                Back {athlete.fullName.split(' ')[0]}'s next race.
              </h2>
              <p className="max-w-xl text-base text-paper/90">
                Donations move directly to {athlete.fullName.split(' ')[0]} after a 3% platform fee. You'll get a receipt, a thank-you note, and a post-event update.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/sign-in" tone="flame" size="lg">
                Donate
              </LinkButton>
              <Link
                href="/brands"
                className="rounded-full px-6 py-3 text-sm font-semibold text-paper/90 hover:bg-paper/10"
              >
                I'm a brand — let's talk →
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
