import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How athletes, supporters, and brands use ARC — from creating a profile to closing the loop after the event.',
};

const athleteSteps = [
  {
    title: 'Create your profile',
    body: 'Photos, videos, accomplishments, the values you stand for, and the sports you compete in. 15 minutes from sign-up to live profile.',
  },
  {
    title: 'List your upcoming events',
    body: 'Each event gets a cost breakdown — flights, race entry, accommodation, gear, coaching. You decide what to make fundable.',
  },
  {
    title: 'Share it with your network',
    body: "Drop the link in your Strava, your Instagram, your team group chat. We provide social preview cards and email templates that don't embarrass you.",
  },
  {
    title: 'Race. Then close the loop',
    body: 'After the event, post an update with photos and results. Backers see exactly what they paid for and stay around for next season.',
  },
];

const supporterSteps = [
  {
    title: 'Find an athlete',
    body: 'Browse by sport, region, or values. Read their story. See the breakdown of what they need.',
  },
  {
    title: 'Fund a line item or the whole thing',
    body: 'Cover the race entry. Cover a hotel night. Cover the entire trip. The math is on the page.',
  },
  {
    title: 'Get receipts and updates',
    body: 'A donation receipt at the moment of the gift, and an athlete-written update after the event closes.',
  },
];

const brandSteps = [
  {
    title: 'Tell us what you need',
    body: 'Sport, region, demographic, value alignment, budget. We build a shortlist of athletes whose profiles fit.',
  },
  {
    title: 'Connect directly',
    body: 'Reach out through the platform. We facilitate the introduction; you own the relationship.',
  },
  {
    title: 'Run the partnership',
    body: 'Single event, multi-race, or season-long. Track athlete performance and content output without leaving the dashboard.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section tone="surface" pad="lg">
        <SectionHeading
          eyebrow="How ARC works"
          title="The same playbook, written for three audiences."
          description="ARC is one network with three jobs to do. Pick your role — the path is straightforward."
          align="center"
        />
      </Section>

      <Section tone="surface-bright" pad="md">
        <Persona
          tone="primary"
          tag="For Athletes"
          title="From profile to post-race update"
          steps={athleteSteps}
          ctaLabel="Create a profile"
          ctaHref="/sign-up"
        />
      </Section>

      <Section tone="surface-low" pad="md" className="border-y border-outline-variant">
        <Persona
          tone="secondary"
          tag="For Supporters"
          title="Donate to a specific dream — and see it land"
          steps={supporterSteps}
          ctaLabel="Browse athletes"
          ctaHref="/athletes"
        />
      </Section>

      <Section tone="surface-bright" pad="md">
        <Persona
          tone="secondary"
          tag="For Brands & Enterprises"
          title="Find aligned athletes. Run an ambassador program that works."
          steps={brandSteps}
          ctaLabel="Talk to partnerships"
          ctaHref="/about#contact"
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
