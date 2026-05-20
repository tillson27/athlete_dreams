import Link from 'next/link';
import Image from 'next/image';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AthleteCard } from '@/components/site/AthleteCard';
import { mockAthletes } from '@/lib/mockAthletes';
import { formatCents, formatProgress } from '@/lib/format';

const pillars = [
  {
    eyebrow: 'Pillar 1',
    title: 'Crowdfund the dream',
    body: 'Athletes raise money from the people who already believe in them — family, training partners, the hometown fan club — for specific events, travel, gear, or training blocks. Every dollar shows where it goes.',
    cta: { href: '/athletes', label: 'Discover athletes' },
    tone: 'flame' as const,
  },
  {
    eyebrow: 'Pillar 2',
    title: 'Brands meet aligned athletes',
    body: 'Search a directory built on values, not follower counts. Reach out, sponsor a single event, or sign a season — without funding an agent in the middle.',
    cta: { href: '/brands', label: 'Sponsor an athlete' },
    tone: 'moss' as const,
  },
  {
    eyebrow: 'Pillar 3',
    title: 'Managed ambassador programs',
    body: 'Hand us your ambassador funnel. We replace the spreadsheet, the Instagram DMs, and the unstructured intake forms with a real pipeline — and the relationships to feed it.',
    cta: { href: '/ambassadors', label: 'See how it works' },
    tone: 'sky' as const,
  },
];

const transparencyPoints = [
  {
    title: 'Money goes to the athlete',
    body: 'Donations move directly to the athlete after platform fees — never frozen, never re-routed. We publish the cost breakdown the athlete entered themselves.',
  },
  {
    title: 'Every campaign shows the math',
    body: 'Flights, accommodation, race entry, gear, coaching — itemized. Supporters fund the line they care about.',
  },
  {
    title: 'Updates close the loop',
    body: 'After the event, the athlete posts an update: how the race went, photos from the line, what is next. Backers see their funding land.',
  },
];

export default function HomePage() {
  const featured = mockAthletes.slice(0, 4);

  return (
    <>
      <Section className="!pt-16 md:!pt-24">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-7">
            <Badge tone="flame">Now onboarding the first 20 athletes</Badge>
            <h1 className="font-display text-balance text-4xl leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The world's most transparent athlete funding network.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink/70">
              FAD connects athletes with the people, sponsors, and brands who want to back them — without losing the story along the way. Donate to a specific race. Sponsor an aligned ambassador. Watch the dream come together.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton tone="primary" size="lg" href="/athletes" className="group">
                Discover athletes
                <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </LinkButton>
              <LinkButton tone="flame" size="lg" href="/sign-up">
                Create an athlete profile
              </LinkButton>
            </div>
            <dl className="flex flex-wrap gap-x-10 gap-y-4 pt-2 text-sm text-ink/65">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/65">Athletes onboarding</dt>
                <dd className="font-display text-3xl text-ink">20</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/65">Sports represented</dt>
                <dd className="font-display text-3xl text-ink">12</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink/65">Platform fees</dt>
                <dd className="font-display text-3xl text-ink">3%</dd>
              </div>
            </dl>
          </div>
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[var(--radius-card)] bg-ink/10 shadow-2xl md:ml-auto">
            <Image
              src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1200&q=70"
              alt="Athlete running on a track at dawn"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-paper/95 p-5 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-flame">
                Live · Tokyo Marathon 2026
              </p>
              <p className="mt-1 font-display text-xl">Maya Okafor</p>
              <p className="mt-1 text-sm text-ink/70">
                {formatCents(1_840_000)} raised of {formatCents(4_200_000)}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-flame"
                  style={{ width: `${formatProgress(1_840_000, 4_200_000)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="!py-16 bg-paper-soft border-y border-ink/5">
        <div className="grid gap-10 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="space-y-4 rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-inset ring-ink/5">
              <Badge tone={pillar.tone}>{pillar.eyebrow}</Badge>
              <h3 className="font-display text-2xl leading-tight">{pillar.title}</h3>
              <p className="text-sm text-ink/70">{pillar.body}</p>
              <Link
                href={pillar.cta.href}
                className="inline-flex text-sm font-semibold text-ink hover:text-flame"
              >
                {pillar.cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Athletes raising right now"
            title="Real stories. Real costs. Real receipts."
            description="Every athlete on FAD writes their own story and itemizes what they need. Pick a campaign and fund a line."
          />
          <LinkButton tone="ghost" href="/athletes">
            See the full directory →
          </LinkButton>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((athlete) => (
            <AthleteCard key={athlete.athleteSlug} athlete={athlete} />
          ))}
        </div>
      </Section>

      <Section className="bg-ink text-paper">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-paper/90">
              Why FAD
            </p>
            <h2 className="font-display text-balance text-4xl leading-tight md:text-5xl">
              Transparency is the product.
            </h2>
            <p className="text-base leading-relaxed text-paper/90">
              Other platforms ask you to trust them. FAD is built so you don't have to. Every campaign shows the cost breakdown. Every dollar is traced to the athlete. Every event closes with an update so backers can see the trip they paid for.
            </p>
          </div>
          <div className="grid gap-5">
            {transparencyPoints.map((point) => (
              <div key={point.title} className="rounded-2xl bg-paper/5 p-6 ring-1 ring-inset ring-paper/10">
                <h3 className="font-display text-xl">{point.title}</h3>
                <p className="mt-2 text-sm text-paper/90">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-[var(--radius-card)] bg-flame px-6 py-10 text-paper sm:px-8 sm:py-14 md:px-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-balance text-4xl leading-tight md:text-5xl">
                Are you the athlete?
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-paper/90">
                Spend 15 minutes creating a profile. Tell your story, list your accomplishments, and itemize the season ahead. We'll do the rest — and we won't sell your data to anyone.
              </p>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/sign-up" tone="primary" size="lg" className="group">
                  Start a profile
                  <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </LinkButton>
                <LinkButton href="/how-it-works" tone="ghost" size="lg" className="!text-paper hover:!bg-paper/15">
                  See the playbook
                </LinkButton>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-paper/90">
              {[
                'No upfront cost. 3% platform fee on successful donations.',
                'Bring your own audience or get matched with aligned brands.',
                'Post-event updates are built in — your story keeps living.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl bg-paper/10 p-4 ring-1 ring-inset ring-paper/10">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-paper text-flame text-xs font-bold">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
