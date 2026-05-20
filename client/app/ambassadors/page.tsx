import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/site/Section';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Managed ambassador programs',
  description:
    'Hand FAD your ambassador funnel. We replace the spreadsheet, the Instagram DMs, and the unstructured intake forms with a real pipeline.',
};

const problems = [
  {
    label: 'Today',
    body: 'One person on your marketing team scraping race results, scrolling Instagram, and filling a spreadsheet. Athletes apply through a Google Form. Nobody answers.',
  },
  {
    label: 'With FAD',
    body: 'A pre-vetted directory of athletes who already filled out a structured profile. We surface the ones who fit your brief and handle the back-and-forth until contract.',
  },
];

const services = [
  {
    title: 'Sourcing',
    body: 'We pull from our directory + targeted outreach. Quarterly cohorts sized to your program — never a single-source pipeline.',
  },
  {
    title: 'Intake',
    body: 'Structured applications mapped to your brand values and required deliverables — no more free-text Google Forms.',
  },
  {
    title: 'Pipeline tracking',
    body: 'In-platform Kanban from submitted → shortlisted → approved → onboarded. Your team sees the same view we do.',
  },
  {
    title: 'Activation & reporting',
    body: 'Quarterly performance reports — deliverables shipped, content output, audience growth — tied to athlete profile updates.',
  },
];

export default function AmbassadorsPage() {
  return (
    <>
      <Section>
        <div className="grid items-end gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Badge tone="sky">Managed ambassador programs</Badge>
            <h1 className="font-display text-balance text-4xl leading-tight sm:text-5xl md:text-6xl">
              Stop running your ambassador program out of a spreadsheet.
            </h1>
            <p className="max-w-2xl text-lg text-ink/75">
              Enterprise sports brands tell us the same story: an internal team of one, scraping Strava and Instagram, with applications piling up in a Google Form nobody reads. FAD takes that whole flow off your plate.
            </p>
          </div>
          <LinkButton href="/about#contact" tone="primary" size="lg">
            Book a 20-minute scoping call
          </LinkButton>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.label}
              className="rounded-[var(--radius-card)] bg-paper-soft p-7 ring-1 ring-inset ring-ink/5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
                {problem.label}
              </p>
              <p className="mt-3 text-base leading-relaxed text-ink/80">{problem.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-ink text-paper">
        <SectionHeading
          eyebrow="What we run"
          title="A four-stage funnel, end to end."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="rounded-[var(--radius-card)] bg-paper/5 p-6 ring-1 ring-inset ring-paper/10"
            >
              <p className="font-display text-3xl text-flame">0{index + 1}</p>
              <h3 className="mt-4 font-display text-2xl leading-tight">{service.title}</h3>
              <p className="mt-3 text-sm text-paper/75">{service.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-[var(--radius-card)] bg-sky px-6 py-10 text-paper sm:px-8 sm:py-14 md:px-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-4xl leading-tight md:text-5xl">
                Built for brands with 50+ ambassadors.
              </h2>
              <p className="max-w-xl text-base text-paper/90">
                If you are running an ambassador program at scale — running brands, outdoor brands, nutrition, gear — we should talk. We will scope your program in a 20-minute call and quote a flat quarterly fee.
              </p>
              <LinkButton href="/about#contact" tone="primary" size="lg">
                Start a scoping conversation
              </LinkButton>
            </div>
            <ul className="space-y-3 text-sm text-paper/90">
              {[
                'Quarterly cohorts of 10–50 ambassadors.',
                'Flat fee per quarter — no per-athlete pricing games.',
                'Your team sees the same Kanban we do.',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-paper/10 p-4 ring-1 ring-inset ring-paper/15"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-paper text-sky text-xs font-bold">
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
