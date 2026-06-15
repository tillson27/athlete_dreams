import { SlideShell, StatCard, type Slide } from '../_shell';

export const tractionSlide: Slide = {
  id: 'traction',
  title: 'Traction & validation',
  section: 'market',
  render: () => (
    <SlideShell eyebrow="Traction">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        Early proof points the model holds.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Pre-launch research, athlete pipeline, and early campaign performance during the closed beta.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-12 gap-4">
        <div className="col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard value="142" label="Athletes on the verified pipeline waitlist" />
            <StatCard value="$2.4M" label="Indicative campaign value across the pipeline" tone="primary" />
            <StatCard value="94%" label="Retention from beta athletes who launched campaign 1" />
            <StatCard value="12.4%" label="Average month-over-month supporter growth (closed beta)" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Channels working
            </p>
            <ul className="space-y-2 text-[13px] text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-semibold text-on-surface">Athlete-to-athlete referral</span> drives
                  61% of waitlist signups. Verified profile + payout transparency are the magnets.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" />
                <span>
                  <span className="font-semibold text-on-surface">Coach + club captain warm intros</span>
                  ~22% of pipeline; high conversion, low CAC.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-on-surface" />
                <span>
                  <span className="font-semibold text-on-surface">Mission-page traffic</span> converts at 4.8%
                  to campaign back &mdash; strong validation of the transparency narrative.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Case · Maya Okafor</p>
          <h3 className="font-display text-xl font-bold text-on-surface">
            $1,840 raised toward Tokyo Marathon &mdash; in 9 days, from 48 backers.
          </h3>
          <ul className="mt-2 space-y-1.5 text-[12px] text-on-primary-container/85">
            <li>· First campaign launched 2026-05-30</li>
            <li>· 55% of $3,360 ask covered in week one</li>
            <li>· 12 of 48 backers gave to a second campaign</li>
            <li>· Post-race recap pending June 2026</li>
          </ul>
          <div className="mt-auto rounded-card bg-white/60 p-3 text-[11px] italic text-on-surface">
            &ldquo;I have never felt comfortable asking. The receipt page lets me share the math, not myself.
            That changed everything.&rdquo; &mdash; Maya Okafor, FAD beta athlete
          </div>
        </div>
      </div>
    </SlideShell>
  ),
};
