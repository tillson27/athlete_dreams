import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge, VerifiedChip } from '@/components/ui/Badge';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';
import { formatSport } from '@/lib/format';
import { CassandraProfile } from './CassandraProfile';

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

  if (athlete.athleteSlug === 'cassandra-de-winter') {
    return <CassandraProfile athlete={athlete} />;
  }

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
              <LinkButton tone="primary" size="lg" href="#story">
                Read the story
              </LinkButton>
              <LinkButton
                tone="ghost"
                size="lg"
                href="/athletes"
                className="!text-white !bg-white/10 hover:!bg-white/20 backdrop-blur-md ring-1 ring-inset ring-white/20"
              >
                Explore athletes
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY STAT STRIP */}
      <section className="border-b border-outline-variant bg-surface-container-low py-6">
        <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] grid-cols-2 gap-4 px-5 md:grid-cols-3 md:gap-12 md:px-16">
          <StripStat label="Discipline" value={formatSport(athlete.primarySport)} />
          <StripStat label="Based in" value={athlete.hometown} />
          <StripStat label="Career highlights" value={String(athlete.accomplishments.length)} />
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

      {/* GROWTH BAND — invite athletes to build their own profile */}
      <Section tone="surface" pad="lg">
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
          <div className="relative z-10 max-w-2xl space-y-4">
            <Badge tone="primary-soft">For athletes</Badge>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              Your story deserves a page like this.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-white/80">
              Build a verified profile that shows your whole journey — results, milestones, and the
              values you run by. It takes about 15 minutes.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <LinkButton href="/sign-up" tone="primary" size="lg">
                Start your profile
              </LinkButton>
              <LinkButton
                href="/for-athletes"
                tone="ghost"
                size="lg"
                className="!text-white hover:!bg-white/15"
              >
                See how it works →
              </LinkButton>
            </div>
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
