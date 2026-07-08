import type { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Section, SectionHeading } from '@/components/site/Section';
import { formatCents } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Back an athlete — coming soon',
  description:
    'Transparent, direct-to-athlete backing is coming to ARC. See exactly what you fund — race entries, travel, coaching — and get a recap when the race is run.',
};

const sampleCostLines = [
  { label: 'Race entry — Lost Soul 100-miler', amountCents: 45000 },
  { label: 'Travel + accommodation', amountCents: 60000 },
  { label: 'Coaching block (8 weeks)', amountCents: 35000 },
  { label: 'Physio + recovery', amountCents: 20000 },
];

const steps = [
  {
    title: 'Pick a line item',
    body: 'Every campaign is an itemized season — race entry, flights, coaching. You back the exact thing you want to make happen.',
  },
  {
    title: 'Money goes to the athlete',
    body: 'Direct to the runner after a small platform fee. No holding periods, no middlemen.',
  },
  {
    title: 'See it land',
    body: 'After the race you get a recap from the athlete — the result, the photos, and what your backing paid for.',
  },
];

export default function SupportComingSoonPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="primary-soft">Coming after launch</Badge>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
            Backing athletes is on the way.
          </h1>
          <p className="mt-4 text-lg text-on-surface-variant">
            We&rsquo;re launching ARC story-first. Transparent, direct-to-athlete backing — where you
            fund a specific race, trip, or training block and see exactly where it lands — arrives
            next.
          </p>
        </div>
      </Section>

      <Section tone="surface-low" pad="md" className="border-y border-outline-variant">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          {/* Sample itemized campaign — transparency is the whole point */}
          <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <p className="eyebrow text-primary">What backing will look like</p>
            <h2 className="mt-2 font-display text-xl font-bold text-on-surface">
              A season, itemized.
            </h2>
            <ul className="mt-5 space-y-3">
              {sampleCostLines.map((line) => (
                <li
                  key={line.label}
                  className="flex items-center justify-between gap-4 border-b border-outline-variant/40 pb-3 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="text-on-surface">{line.label}</span>
                  <span className="font-display font-bold text-on-surface">
                    {formatCents(line.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-on-surface-variant">
              Sample campaign. Every dollar is attached to a line you can point at.
            </p>
          </div>

          <ol className="space-y-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-5">
                <span className="font-display text-3xl font-extrabold text-on-surface-variant/40">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight text-on-surface">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-on-surface-variant">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="surface" pad="lg">
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            eyebrow="Until then"
            title="The best way to back a runner today? Follow them."
            description="Follow the runners you believe in and you'll see it here and on the community feed the moment backing opens."
            align="center"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/athletes" tone="primary" size="lg">
              Discover runners
            </LinkButton>
            <LinkButton href="/community" tone="secondary" size="lg">
              See the community feed
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
