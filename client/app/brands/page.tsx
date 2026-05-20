import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'For brands',
  description:
    'Discover athletes who fit your brand values, sponsor specific events, or sign full season deals — without paying an agent in the middle.',
};

const valueProps = [
  {
    title: 'Search by values, not vanity metrics',
    body: 'Filter by sport, region, and the values athletes told us matter — adaptive sport, Indigenous representation, mental health, women in sport, climate action.',
  },
  {
    title: 'Sponsor at the level that fits',
    body: 'Back a single race, fund a piece of gear, or commit to a full-season ambassador deal. Every option is a fixed scope, not an open retainer.',
  },
  {
    title: 'See the receipts',
    body: 'Athletes post post-event updates with photos and results. You see where your dollars landed — for your marketing team and for your finance team.',
  },
  {
    title: 'No agency middle-man',
    body: 'Reach out to athletes directly through their FAD profile. We facilitate the contract; you keep the relationship.',
  },
];

export default function BrandsPage() {
  return (
    <>
      <Section>
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <Badge tone="moss">For brands & corporate partners</Badge>
            <h1 className="font-display text-balance text-4xl leading-tight sm:text-5xl md:text-6xl">
              Sponsor athletes who fit your story.
            </h1>
            <p className="max-w-xl text-lg text-ink/75">
              FAD is a working directory of athletes with verified accomplishments, current campaigns, and stated values. Find the athlete you want to back — and skip the agent gauntlet.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/athletes" tone="primary" size="lg">
                Browse the directory
              </LinkButton>
              <LinkButton href="/about#contact" tone="secondary" size="lg">
                Talk to a partnership lead
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: '20', label: 'Athletes in pilot cohort' },
              { stat: '12', label: 'Sports represented' },
              { stat: '3%', label: 'Platform fee — that is it' },
              { stat: '48h', label: 'Avg. brand-to-athlete reply time' },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--radius-card)] bg-paper-soft p-6 ring-1 ring-inset ring-ink/5">
                <p className="font-display text-4xl">{item.stat}</p>
                <p className="mt-2 text-sm text-ink/70">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-paper-soft border-y border-ink/5">
        <SectionHeading
          eyebrow="Why brands use FAD"
          title="Built for marketing teams that hate the agent dance."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {valueProps.map((prop) => (
            <div key={prop.title} className="rounded-[var(--radius-card)] bg-white p-7 ring-1 ring-inset ring-ink/5">
              <h3 className="font-display text-2xl leading-tight">{prop.title}</h3>
              <p className="mt-3 text-sm text-ink/70">{prop.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-[var(--radius-card)] bg-moss px-6 py-10 text-paper sm:px-8 sm:py-14 md:px-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Tell us what you're looking for.
              </h2>
              <p className="max-w-xl text-base text-paper/90">
                Sport, region, demographic, value alignment, budget. We'll send a shortlist of athletes whose profiles fit — within 48 hours, with no contract required.
              </p>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/about#contact" tone="primary" size="lg">
                  Request a shortlist
                </LinkButton>
                <LinkButton href="/ambassadors" tone="ghost" size="lg" className="!text-paper hover:!bg-paper/15">
                  See ambassador programs →
                </LinkButton>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-paper/90">
              {[
                'Match on values, sport, and audience — not follower count.',
                'Single-event sponsorships from $500. Season deals scoped per athlete.',
                'Full handoff once the contract is signed. You own the relationship.',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-paper/10 p-4 ring-1 ring-inset ring-paper/10"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-paper text-moss text-xs font-bold">
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
