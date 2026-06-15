import { SlideShell, type Slide } from '../_shell';

const founders = [
  {
    initials: 'JT',
    name: 'Josh Tillson',
    role: 'Founder · Product & Engineering',
    highlights: [
      'Built shippable products across 4 startups',
      'Previously: founding eng at EMLY AI · realtor SaaS',
      'Two-time category-3 endurance cyclist · empathy with the athlete persona',
    ],
    timeStatus: 'Full-time',
    location: 'Toronto, ON',
  },
];

const advisors = [
  {
    initials: 'AS',
    name: 'Andrew Stengler',
    role: 'GTM Advisor · Marketplace',
    highlights: [
      'Top-1% revenue advisor; built distribution at eXp Realty Canada',
      'Multi-sided marketplace activation playbook',
    ],
    timeStatus: 'Advisor',
    location: 'Calgary, AB',
  },
  {
    initials: 'KR',
    name: 'Kyle Rich',
    role: 'Engineering Advisor · Platform',
    highlights: [
      'Staff engineer · payments + multi-tenant infra',
      'Stripe Connect integration experience at scale',
    ],
    timeStatus: 'Advisor',
    location: 'Vancouver, BC',
  },
];

function Person({
  initials,
  name,
  role,
  highlights,
  timeStatus,
  location,
  tone,
}: {
  initials: string;
  name: string;
  role: string;
  highlights: string[];
  timeStatus: string;
  location: string;
  tone: 'founder' | 'advisor';
}) {
  const isAdvisor = tone === 'advisor';
  return (
    <div
      className={
        isAdvisor
          ? 'flex h-full flex-col rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low p-4 card-lift'
          : 'flex h-full flex-col rounded-2xl border border-primary/30 bg-primary-soft/40 p-4 card-lift'
      }
    >
      <p
        className={
          isAdvisor
            ? 'text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant'
            : 'text-[10px] font-bold uppercase tracking-[0.18em] text-primary'
        }
      >
        {isAdvisor ? 'Advisor' : 'Founder'}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span
          className={
            isAdvisor
              ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-sm font-bold text-on-surface/80'
              : 'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary-container text-sm font-bold text-white'
          }
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-on-surface">{name}</p>
          <p className="text-[11px] text-on-surface-variant">{role}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-[11px] leading-snug text-on-surface-variant">
        {highlights.map((h) => (
          <li key={h} className="flex gap-1.5">
            <span
              className={
                isAdvisor
                  ? 'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-on-surface-variant/60'
                  : 'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary'
              }
            />
            <span className="text-on-surface/80">{h}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-outline-variant/60 pt-2 text-[10px] font-semibold text-on-surface-variant">
        <p>{timeStatus}</p>
        <p className="text-on-surface-variant/80">{location}</p>
      </div>
    </div>
  );
}

export const teamSlide: Slide = {
  id: 'team',
  title: 'Team',
  section: 'team',
  render: () => (
    <SlideShell eyebrow="Team">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        Builder-led. Advised by the GTM operators we&rsquo;ll need next.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Lean by design. The team scales with the proof &mdash; the pre-seed funds engineering depth and the first
        athlete-success hire.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
        {founders.map((founder) => (
          <Person key={founder.name} {...founder} tone="founder" />
        ))}
        {advisors.map((advisor) => (
          <Person key={advisor.name} {...advisor} tone="advisor" />
        ))}
      </div>

      <div className="mt-5 rounded-card border border-outline-variant/70 bg-surface-container-lowest px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Why this team
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-on-surface">
          A product-engineering founder who has shipped marketplaces before, paired with advisors who have
          built sport-side trust and payments rails at scale. The bench is configured for the next twelve
          months, not the next decade.
        </p>
      </div>
    </SlideShell>
  ),
};
