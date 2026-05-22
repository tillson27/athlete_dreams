import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Brand Hub',
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

const dashboardPreview = [
  { label: 'Active Sponsorships', value: '12', delta: '+3 this quarter' },
  { label: 'Athletes in Pipeline', value: '38', delta: 'Across 6 sports' },
  { label: 'Total Investment', value: '$184K', delta: 'YTD' },
  { label: 'Content Output', value: '247', delta: 'Posts shipped' },
];

export default function BrandsPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <Badge tone="secondary-soft">For Brands & Corporate Partners</Badge>
            <h1 className="font-display text-balance text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Sponsor athletes who fit your story.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
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
          <div className="relative">
            {/* Brand Hub dashboard tease */}
            <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                <span className="font-display text-lg font-bold">Brand Hub</span>
                <Badge tone="success">Live</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {dashboardPreview.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-card bg-surface-container-low p-4 ring-1 ring-inset ring-outline-variant/60"
                  >
                    <p className="label-bold text-on-surface-variant">{stat.label}</p>
                    <p className="mt-2 font-display text-2xl font-extrabold text-on-surface">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">{stat.delta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-card bg-secondary p-4 text-white">
                <p className="label-bold text-white/75">Avg. brand-to-athlete reply</p>
                <p className="mt-1 font-display text-2xl font-extrabold">48 hours</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface-low" pad="xl" className="border-y border-outline-variant">
        <SectionHeading
          eyebrow="Why brands use FAD"
          title="Built for marketing teams that hate the agent dance."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {valueProps.map((prop) => (
            <div
              key={prop.title}
              className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-7"
            >
              <h3 className="font-display text-2xl font-bold leading-tight">{prop.title}</h3>
              <p className="mt-3 text-on-surface-variant">{prop.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="surface" pad="lg">
        <div className="rounded-card bg-secondary px-6 py-12 text-white md:px-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                Tell us what you&rsquo;re looking for.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-white/85">
                Sport, region, demographic, value alignment, budget. We&rsquo;ll send a shortlist of athletes whose profiles fit — within 48 hours, with no contract required.
              </p>
              <div className="flex flex-wrap gap-3">
                <LinkButton href="/about#contact" tone="inverse" size="lg">
                  Request a shortlist
                </LinkButton>
                <LinkButton
                  href="/ambassadors"
                  tone="ghost"
                  size="lg"
                  className="!text-white hover:!bg-white/15"
                >
                  See ambassador programs →
                </LinkButton>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-white/90">
              {[
                'Match on values, sport, and audience — not follower count.',
                'Single-event sponsorships from $500. Season deals scoped per athlete.',
                'Full handoff once the contract is signed. You own the relationship.',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-card bg-white/10 p-4 ring-1 ring-inset ring-white/15"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-primary-container text-xs font-bold text-on-primary">
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
