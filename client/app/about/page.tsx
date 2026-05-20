import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why we built FAD, where existing platforms fall short, and how to get in touch.',
};

const principles = [
  {
    title: 'The athlete owns the story.',
    body: 'They write the profile. They choose the photos. They decide what to make fundable. Our job is to host the page and clear the wire.',
  },
  {
    title: 'Money moves directly.',
    body: 'Donations land in the athlete\'s account, minus a 3% platform fee. We do not warehouse funds. We do not freeze payouts pending review.',
  },
  {
    title: 'Transparency is the product.',
    body: 'Cost breakdowns by default. Post-event updates by default. If a campaign cannot show the math, it does not belong on FAD.',
  },
  {
    title: 'No agent middlemen.',
    body: 'Brand-to-athlete conversations happen through the athlete\'s profile, not through a gated salesperson. We facilitate; we do not gatekeep.',
  },
];

const competitors = [
  {
    name: 'Makeachamp',
    delta: 'Funds get held back. Athletes wait — sometimes for months — to see money they raised. FAD pays out as donations clear.',
  },
  {
    name: 'Sportfunder',
    delta: 'Sport-specific and feature-thin. FAD is cross-sport with a real directory and brand integration.',
  },
  {
    name: 'OpenSponsorship',
    delta: 'Brand-first marketplace where athletes are search results. FAD leads with athlete stories; sponsorships layer on top.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="About FAD Network"
          title="A funding platform where the athlete comes first."
          description="We started FAD because every existing tool treats athletes like inventory. Crowdfunding sites freeze payouts. Sponsorship marketplaces sort by follower count. Ambassador programs run out of Google Forms. We thought we could do better — and we are starting with 20 athletes to prove it."
          align="center"
        />
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle.title} className="rounded-[var(--radius-card)] bg-paper-soft p-7 ring-1 ring-inset ring-ink/5">
              <h3 className="font-display text-2xl leading-tight">{principle.title}</h3>
              <p className="mt-3 text-sm text-ink/75">{principle.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-ink text-paper">
        <SectionHeading
          eyebrow="Why not them"
          title="What is wrong with the alternatives."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {competitors.map((c) => (
            <div key={c.name} className="rounded-[var(--radius-card)] bg-paper/5 p-7 ring-1 ring-inset ring-paper/10">
              <Badge tone="flame">{c.name}</Badge>
              <p className="mt-4 text-sm text-paper/80">{c.delta}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact">
        <div className="grid gap-10 rounded-[var(--radius-card)] bg-paper-soft px-6 py-10 ring-1 ring-inset ring-ink/10 sm:px-8 sm:py-12 md:grid-cols-[1.2fr_1fr] md:px-14">
          <div className="space-y-5">
            <Badge tone="flame">Get in touch</Badge>
            <h2 className="font-display text-balance text-4xl leading-tight md:text-5xl">
              We answer every email.
            </h2>
            <p className="max-w-xl text-base text-ink/75">
              Whether you are an athlete who wants to join the pilot cohort, a brand looking for a shortlist, or an enterprise scoping an ambassador program — write us a few sentences and we will reply within 48 hours.
            </p>
            <p className="text-sm text-ink/65">
              For now, email us directly:&nbsp;
              <a className="font-semibold underline" href="mailto:hello@fad.network">hello@fad.network</a>
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/sign-up" tone="flame" size="lg">
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
                className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset ring-ink/5"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-flame text-white text-xs font-bold">
                  ✓
                </span>
                <span className="text-ink/80">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
