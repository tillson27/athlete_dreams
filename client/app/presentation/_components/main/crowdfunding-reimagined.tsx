import { SlideShell, type Slide } from '../_shell';
import { Check, Megaphone, ShieldCheck, Users } from '../icons';

const pillars = [
  {
    icon: <Megaphone className="h-5 w-5" />,
    title: 'No more asking',
    body: 'Funding is the byproduct of long-term storytelling, not a transactional ask. Micro-contributions are embedded inside authentic content.',
    bullet: 'Engagement-first conversion',
    tone: 'primary' as const,
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'A shared journey',
    body: "Backers are not donors. They are roadmap partners — live training feeds, performance roadmaps, raw grind content build an unbreakable bond.",
    bullet: 'Real-time impact sync',
    tone: 'secondary' as const,
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Radical transparency',
    body: 'Trust is the moat. A live public ledger and OCR-verified receipt pipeline create an audit trail that no other platform matches.',
    bullet: 'Immutable result verification',
    tone: 'ink' as const,
  },
];

const tones = {
  primary: {
    border: 'border-primary/30',
    bg: 'bg-primary-soft/40',
    iconBg: 'bg-primary text-on-primary',
    accent: 'text-primary',
  },
  secondary: {
    border: 'border-secondary/30',
    bg: 'bg-secondary-soft/40',
    iconBg: 'bg-secondary text-on-secondary',
    accent: 'text-secondary',
  },
  ink: {
    border: 'border-on-surface/15',
    bg: 'bg-surface-container-low',
    iconBg: 'bg-inverse-surface text-white',
    accent: 'text-on-surface',
  },
};

export const crowdfundingReimaginedSlide: Slide = {
  id: 'crowdfunding-reimagined',
  title: 'Crowdfunding reimagined',
  section: 'product',
  render: () => (
    <SlideShell eyebrow="Product · Crowdfunding Reimagined">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        Three pillars that make athlete crowdfunding actually work.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Legacy crowdfunding platforms optimize for the first donation. ARC optimizes for the second, third, and
        tenth &mdash; the repeat backer is where the unit economics live.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
        {pillars.map((pillar, index) => {
          const tone = tones[pillar.tone];
          return (
            <div
              key={pillar.title}
              className={`flex flex-col gap-4 rounded-2xl border ${tone.border} ${tone.bg} p-6`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone.iconBg}`}>
                  {pillar.icon}
                </span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.accent}`}>
                  Pillar 0{index + 1}
                </p>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface">{pillar.title}</h3>
              <p className="text-[13px] leading-relaxed text-on-surface-variant">{pillar.body}</p>
              <div className={`mt-auto flex items-center gap-2 text-[11px] font-bold ${tone.accent}`}>
                <Check className="h-3.5 w-3.5" />
                <span>{pillar.bullet}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-card border border-outline-variant/70 bg-surface-container-lowest px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Repeat-backer conversion
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-on-surface">
            3.4x <span className="text-base font-normal text-on-surface-variant">repeat-give rate vs. legacy crowdfunding</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Average campaign close
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">
            107% <span className="text-base font-normal text-on-surface-variant">of target on funded campaigns</span>
          </p>
        </div>
      </div>
    </SlideShell>
  ),
};
