import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How runners and their supporters use ARC — from building a profile to following the whole journey.',
};

const athleteSteps = [
  {
    title: 'Build your profile',
    body: 'Your story, photos, personal bests, and the values you run by. About 10 minutes from sign-up to a live profile.',
  },
  {
    title: 'Back it up',
    body: 'Link your official race results so anyone reading your profile can check the times for themselves.',
  },
  {
    title: 'Share it with your world',
    body: "Drop the link in your Strava, your Instagram, your run-club chat. We generate social cards that make your résumé look the part.",
  },
  {
    title: 'Race. Then keep the story going',
    body: 'Post race results and training updates. Your profile grows with every season — a living record instead of a lost highlight.',
  },
];

const supporterSteps = [
  {
    title: 'Discover runners',
    body: 'Browse by discipline, level, or region — from everyday run-club captains to amateur-elites. Read the whole story, not just the stats.',
  },
  {
    title: 'Follow the journey',
    body: 'Follow the runners you believe in and watch the arc unfold — the build-up, the setbacks, the breakthroughs, race by race.',
  },
  {
    title: 'Show up on race day',
    body: 'Some runners open their season to support. When they do, you can chip in toward a specific goal — and see exactly where it went.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <SectionHeading
          eyebrow="How ARC works"
          title="A home for runners, and the people who follow them."
          description="ARC is one network with two jobs: give runners a lasting home for their whole story, and give their people a front-row seat. Pick your role — the path is straightforward."
          align="center"
        />
      </Section>

      <Section tone="surface-bright" pad="md">
        <Persona
          tone="primary"
          tag="For Runners"
          title="From profile to a living race record"
          steps={athleteSteps}
          ctaLabel="Build your profile"
          ctaHref="/sign-up"
        />
      </Section>

      <Section tone="surface-low" pad="md" className="border-y border-outline-variant">
        <Persona
          tone="secondary"
          tag="For Followers"
          title="Find runners worth following — and watch the arc unfold"
          steps={supporterSteps}
          ctaLabel="Discover runners"
          ctaHref="/athletes"
        />
      </Section>
    </>
  );
}

function Persona({
  tone,
  tag,
  title,
  steps,
  ctaLabel,
  ctaHref,
}: {
  tone: 'primary' | 'secondary';
  tag: string;
  title: string;
  steps: { title: string; body: string }[];
  ctaLabel: string;
  ctaHref: string;
}) {
  const badgeTone = tone === 'primary' ? 'primary-soft' : 'secondary-soft';
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
      <div className="space-y-5">
        <Badge tone={badgeTone}>{tag}</Badge>
        <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
          {title}
        </h2>
        <LinkButton href={ctaHref} tone="primary" size="lg">
          {ctaLabel}
        </LinkButton>
      </div>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="card-lift flex gap-5 rounded-card border border-outline-variant bg-surface-container-lowest p-6"
          >
            <span className="font-display text-3xl font-extrabold text-on-surface-variant/40">
              0{index + 1}
            </span>
            <div>
              <h3 className="font-display text-xl font-bold leading-tight">{step.title}</h3>
              <p className="mt-2 text-on-surface-variant">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
