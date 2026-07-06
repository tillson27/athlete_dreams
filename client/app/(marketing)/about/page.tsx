import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why we built ARC, where existing platforms fall short, and how to get in touch.',
};

const principles = [
  {
    title: 'The athlete owns the story.',
    body: 'They write the profile. They choose the photos. They decide what to make fundable. Our job is to host the page and clear the wire.',
  },
  {
    title: 'Money moves directly.',
    body: "Donations land in the athlete's account, minus a 3% platform fee. We do not warehouse funds. We do not freeze payouts pending review.",
  },
  {
    title: 'Transparency is the product.',
    body: 'Cost breakdowns by default. Post-event updates by default. If a campaign cannot show the math, it does not belong on ARC.',
  },
  {
    title: 'No agent middlemen.',
    body: "Brand-to-athlete conversations happen through the athlete's profile, not through a gated salesperson. We facilitate; we do not gatekeep.",
  },
];

const competitors = [
  {
    name: 'Makeachamp',
    delta: 'Funds get held back. Athletes wait — sometimes for months — to see money they raised. ARC pays out as donations clear.',
  },
  {
    name: 'Sportfunder',
    delta: 'Sport-specific and feature-thin. ARC is cross-sport with a real directory and brand integration.',
  },
  {
    name: 'OpenSponsorship',
    delta: 'Brand-first marketplace where athletes are search results. ARC leads with athlete stories; sponsorships layer on top.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <SectionHeading
          eyebrow="About ARC"
          title="A funding platform where the athlete comes first."
          description="We started ARC because every existing tool treats athletes like inventory. Crowdfunding sites freeze payouts. Sponsorship marketplaces sort by follower count. Ambassador programs run out of Google Forms. We thought we could do better — and we are starting with 20 athletes to prove it."
          align="center"
        />
      </Section>

      <Section tone="surface" pad="md" className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-7"
            >
              <h3 className="font-display text-2xl font-bold leading-tight">{principle.title}</h3>
              <p className="mt-3 text-on-surface-variant">{principle.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="inverse" pad="xl">
        <SectionHeading eyebrow="Why not them" title="What's wrong with the alternatives." onDark />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {competitors.map((c) => (
            <div
              key={c.name}
              className="rounded-card bg-white/5 p-7 ring-1 ring-inset ring-white/10"
            >
              <Badge tone="primary-soft">{c.name}</Badge>
              <p className="mt-4 text-sm text-white/80">{c.delta}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" tone="surface" pad="lg">
        <div className="grid gap-10 rounded-card border border-outline-variant bg-surface-container-low px-6 py-12 md:grid-cols-[1.2fr_1fr] md:px-14">
          <div className="space-y-5">
            <Badge tone="primary-soft">Get in touch</Badge>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              We answer every email.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-on-surface-variant">
              Whether you&rsquo;re an athlete who wants to join the pilot cohort, a brand looking for a shortlist, or an enterprise scoping an ambassador program — write us a few sentences and we&rsquo;ll reply within 48 hours.
            </p>
            <p className="text-sm text-on-surface-variant">
              For now, email us directly:{' '}
              <a className="font-semibold text-primary underline" href="mailto:hello@arc.network">
                hello@arc.network
              </a>
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/sign-up" tone="primary" size="lg">
                Apply as an athlete
              </LinkButton>
              <LinkButton href="/brands" tone="secondary" size="lg">
                Talk partnerships
              </LinkButton>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              'Athlete cohort: now onboarding through 2026 Q2.',
              'Brand partnerships: rolling — first cohort live by summer 2026.',
              'Managed ambassador programs: scoping for 2026 Q3 launch.',
            ].map((line) => (
              <li
                key={line}
                className="card-lift flex items-start gap-3 rounded-card bg-surface-container-lowest p-4 ring-1 ring-inset ring-outline-variant"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-primary text-xs font-bold text-on-primary">
                  ✓
                </span>
                <span className="text-on-surface-variant">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
