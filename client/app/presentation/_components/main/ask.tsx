import { SlideShell, type Slide } from '../_shell';
import { Check } from '../icons';

const useOfFunds = [
  { label: 'Engineering (2 hires + founder cost)', percent: 55 },
  { label: 'Athlete success + verification ops', percent: 20 },
  { label: 'Brand + supporter acquisition', percent: 15 },
  { label: 'Stripe + compliance infrastructure', percent: 10 },
];

const milestones = [
  '500 verified athletes on platform',
  '$2.5M+ GMV across crowdfunding campaigns',
  'First 3 ambassador-program enterprise contracts',
  'Sponsor marketplace closed-beta with 25 brands',
];

export const askSlide: Slide = {
  id: 'ask',
  title: 'The ask',
  section: 'ask',
  render: () => (
    <SlideShell eyebrow="The Ask">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        $1.2M pre-seed · 18 months to Phase II.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Engineering depth, athlete-success operations, and the brand + supporter acquisition channels that
        turn the wedge into the marketplace.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-12 gap-4">
        <div className="col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Round</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-on-primary-container">$1.2M</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Instrument</p>
                <p className="mt-1 font-display text-2xl font-bold text-on-primary-container">SAFE</p>
                <p className="text-[11px] text-on-primary-container/80">Post-money cap · TBC</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Use of funds
            </p>
            <div className="mt-3 space-y-3">
              {useOfFunds.map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between text-[12px]">
                    <span className="font-semibold text-on-surface">{row.label}</span>
                    <span className="font-display font-bold text-primary">{row.percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-surface-container">
                    <div
                      className="h-full rounded-pill bg-gradient-to-r from-secondary to-primary-container"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-4 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            18-month milestones
          </p>
          <h3 className="font-display text-lg font-bold text-on-surface">
            What this round buys.
          </h3>
          <ul className="space-y-2">
            {milestones.map((milestone) => (
              <li key={milestone} className="flex items-start gap-2 text-[13px] text-on-surface">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>{milestone}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto rounded-card border border-primary/20 bg-primary-soft/40 px-4 py-3 text-[12px] leading-relaxed text-on-primary-container/85">
            <span className="font-bold text-on-primary-container">Then:</span> Series A on Phase II revenue
            (sponsor marketplace + ambassador ACV), not on crowdfunding take-rate alone.
          </div>
        </div>
      </div>
    </SlideShell>
  ),
};
