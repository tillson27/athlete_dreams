import { SlideShell, type Slide } from '../_shell';
import { Globe, Rocket, Trophy } from '../icons';

const phases = [
  {
    icon: <Rocket className="h-5 w-5" />,
    label: 'Phase 01 · Foundation',
    status: 'In motion · 2026',
    title: 'Crowdfunding wedge',
    items: [
      'Verified athlete profiles + performance stats',
      'Itemized campaigns with OCR receipts',
      'Stripe Connect direct payouts (sub-24h)',
      'Post-event reconciliation + recap updates',
    ],
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    label: 'Phase 02 · Institutional Hub',
    status: 'Building · 2027',
    title: 'Sponsor + ambassador marketplace',
    items: [
      'Multi-athlete portfolios for brands',
      'Brand-side discovery + brand-safety review',
      'In-platform contracting + ROI reporting',
      'Tax-receipt workflow for charitable backers',
    ],
  },
  {
    icon: <Globe className="h-5 w-5" />,
    label: 'Phase 03 · Global scale',
    status: 'On the roadmap · 2028+',
    title: 'Network of networks',
    items: [
      'Cross-border payouts, multi-currency',
      'Federation + NSO partnerships',
      'Localized discovery + language support',
      'On-platform brand marketplace',
    ],
  },
];

export const visionSlide: Slide = {
  id: 'vision',
  title: 'Vision · the three phases',
  section: 'vision',
  render: () => (
    <SlideShell eyebrow="Vision · Roadmap">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        Three phases, sequenced so each release earns the right to ship the next.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        We do not launch sponsorship marketplaces before crowdfunding works. We do not chase international
        until the home market is dense. Discipline is the strategy.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
        {phases.map((phase, index) => (
          <div
            key={phase.label}
            className={
              index === 0
                ? 'flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5'
                : 'flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5'
            }
          >
            <div className="flex items-center justify-between">
              <span
                className={
                  index === 0
                    ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary'
                    : 'flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant'
                }
              >
                {phase.icon}
              </span>
              <span
                className={
                  index === 0
                    ? 'rounded-pill bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary'
                    : 'rounded-pill bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant'
                }
              >
                {phase.status}
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              {phase.label}
            </p>
            <h3 className="font-display text-xl font-bold text-on-surface">{phase.title}</h3>
            <ul className="space-y-1.5 text-[12px] text-on-surface-variant">
              {phase.items.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SlideShell>
  ),
};
