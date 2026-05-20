import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How athletes, supporters, and brands use FAD — from creating a profile to closing the loop after the event.',
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
    body: 'Drop the link in your Strava, your Instagram, your team group chat. We provide social preview cards and email templates that don\'t embarrass you.',
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
      <Section>
        <SectionHeading
          eyebrow="How FAD works"
          title="The same playbook, written for three audiences."
          description="FAD is one network with three jobs to do. Pick your role — the path is straightforward."
          align="center"
        />
      </Section>

      <Section className="!pt-0">
        <Persona
          tone="flame"
          tag="For Athletes"
          title="From profile to post-race update"
          steps={athleteSteps}
          ctaLabel="Create a profile"
          ctaHref="/sign-up"
          ctaTone="flame"
        />
      </Section>

      <Section className="bg-paper-soft border-y border-ink/5">
        <Persona
          tone="moss"
          tag="For Supporters"
          title="Donate to a specific dream — and see it land"
          steps={supporterSteps}
          ctaLabel="Browse athletes"
          ctaHref="/athletes"
        />
      </Section>

      <Section>
        <Persona
          tone="sky"
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
  ctaTone = 'primary',
}: {
  tone: 'flame' | 'moss' | 'sky';
  tag: string;
  title: string;
  steps: { title: string; body: string }[];
  ctaLabel: string;
  ctaHref: string;
  ctaTone?: 'primary' | 'flame';
}) {
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
      <div className="space-y-5">
        <Badge tone={tone}>{tag}</Badge>
        <h2 className="font-display text-balance text-4xl leading-tight md:text-5xl">{title}</h2>
        <LinkButton href={ctaHref} tone={ctaTone} size="lg">
          {ctaLabel}
        </LinkButton>
      </div>
      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-5 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-inset ring-ink/5"
          >
            <span className="font-display text-3xl text-ink/30">0{index + 1}</span>
            <div>
              <h3 className="font-display text-xl leading-tight">{step.title}</h3>
              <p className="mt-2 text-sm text-ink/75">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
