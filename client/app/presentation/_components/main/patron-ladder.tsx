import { SlideShell, StatCard, type Slide } from '../_shell';

const tiers = [
  {
    name: 'Silent Fan',
    body: 'Follows the journey. Costs nothing. Builds the audience.',
    width: '20%',
  },
  {
    name: 'Active Follower',
    body: 'Likes, comments, shares. Becomes part of the athlete\'s social proof.',
    width: '40%',
  },
  {
    name: 'Committed Backer',
    body: 'Funds line items. Receives donation receipts and post-event recaps.',
    width: '70%',
  },
  {
    name: 'Elite Patron',
    body: 'Monthly support. Direct line to the athlete. First look at next season.',
    width: '100%',
  },
];

export const patronLadderSlide: Slide = {
  id: 'patron-ladder',
  title: 'From spectators to stakeholders',
  section: 'product',
  render: () => (
    <SlideShell eyebrow="Product · The Patron Ladder">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        From spectators to stakeholders.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        The supporter relationship moves up four tiers as the athlete tells their story. Each tier earns the
        right to the next &mdash; and the unit economics compound.
      </p>

      <div className="mt-6 flex-1 space-y-3">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className="grid grid-cols-12 items-center gap-4 rounded-card border border-outline-variant/70 bg-surface-container-lowest px-5 py-4"
          >
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Tier 0{index + 1}
              </p>
              <p className="font-display text-lg font-bold text-on-surface">{tier.name}</p>
            </div>
            <div className="col-span-5 text-[12px] leading-relaxed text-on-surface-variant">{tier.body}</div>
            <div className="col-span-5">
              <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-container">
                <div
                  className={
                    index === tiers.length - 1
                      ? 'h-full rounded-pill bg-gradient-to-r from-secondary to-primary-container'
                      : 'h-full rounded-pill bg-secondary/80'
                  }
                  style={{ width: tier.width }}
                />
              </div>
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Relationship depth: {tier.width}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard value="84%" label="Tier-to-tier retention conversion across the ladder" />
        <StatCard value="$28" label="Avg first donation · grows 4.6x by Elite Patron" tone="primary" />
        <StatCard value="14 mo" label="Median active supporter lifecycle on FAD" />
      </div>
    </SlideShell>
  ),
};
