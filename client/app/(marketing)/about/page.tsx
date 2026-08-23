import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { BRAND_CONTACT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why we built ARC: a lasting home for a runner’s whole story, where existing tools fall short, and how to get in touch.',
};

const principles = [
  {
    title: 'The runner owns the story.',
    body: 'You write the profile. You choose the photos. You decide what to share. Our job is to host the page and make it look the part.',
  },
  {
    title: 'Receipts are the product.',
    body: 'Every result links back to the official page it came from. No badge to trust, just the source, one click away.',
  },
  {
    title: 'Story before numbers.',
    body: 'The comeback, the reason you lace up, the arc behind the athlete: that comes first. Metrics support the story; they don’t replace it.',
  },
  {
    title: 'Community over vanity.',
    body: 'Followers, run clubs, and people who show up on race day, not a leaderboard sorted by follower count.',
  },
];

const alternatives = [
  {
    name: 'Instagram',
    delta: 'A highlight reel with no context. A race photo gets 200 likes and disappears. ARC keeps the whole arc in one place, sourced and lasting.',
  },
  {
    name: 'Strava',
    delta: 'Great for training data, but it buries your story under splits and segments. ARC leads with who you are, then backs it with the numbers.',
  },
  {
    name: 'A link-in-bio',
    delta: 'A list of links says nothing about the runner behind them. ARC is the destination that link should point to.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <SectionHeading
          eyebrow="About ARC"
          title="A lasting home for a runner’s whole story."
          description="We started ARC because every existing tool flattens running into something smaller than it is: a highlight reel, a wall of data, a list of links. Every runner deserves a real home for the whole arc. We’re starting with a small cohort of runners to prove it."
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
        <SectionHeading eyebrow="Why not them" title="More than a bio link." onDark />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {alternatives.map((c) => (
            <div key={c.name} className="rounded-card bg-white/5 p-7 ring-1 ring-inset ring-white/10">
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
              Whether you&rsquo;re a runner who wants to join ARC, a run club that wants its members
              on ARC, or just have a question &mdash; write us a few sentences and we&rsquo;ll reply
              within 48 hours.
            </p>
            <p className="text-sm text-on-surface-variant">
              For now, email us directly:{' '}
              <a
                className="font-semibold text-primary underline"
                href={`mailto:${BRAND_CONTACT_EMAIL}`}
              >
                {BRAND_CONTACT_EMAIL}
              </a>
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/sign-up" tone="primary" size="lg">
                Start your profile
              </LinkButton>
              <LinkButton href="/athletes" tone="secondary" size="lg">
                Discover runners
              </LinkButton>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              'Runner cohort: onboarding now.',
              'Every discipline welcome: road, trail, ultra, and track.',
              'From first-time half-marathoners to amateur-elites.',
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
