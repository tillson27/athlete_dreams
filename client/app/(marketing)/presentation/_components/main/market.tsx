import { SlideShell, SourceBar, StatCard, type Slide } from '../_shell';

export const marketSlide: Slide = {
  id: 'market',
  title: 'Market sizing',
  section: 'market',
  render: () => (
    <SlideShell eyebrow="Market">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        A large, fragmented market underserved at every tier.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Three revenue stacks compound on the same verified-profile substrate. The TAM is the sum across
        athletes, supporters, and brands &mdash; not just one.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">TAM · 2030</p>
          <p className="mt-2 font-display text-5xl font-extrabold text-on-surface">$8.4B</p>
          <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
            Sub-elite + amateur athlete funding (NA + EU) across crowdfunding, brand sponsorship, and managed
            ambassador programs.
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">SAM · 2028</p>
          <p className="mt-2 font-display text-5xl font-extrabold text-on-primary-container">$1.6B</p>
          <p className="mt-2 text-[12px] leading-relaxed text-on-primary-container/85">
            English-speaking endurance + Olympic sports, focused on Stripe-supported geographies. Our wedge
            audience.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">SOM · Year 3</p>
          <p className="mt-2 font-display text-5xl font-extrabold text-on-surface">$58M</p>
          <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
            3.6% penetration of SAM by Year 3 from crowdfunding GMV + sponsor take-rate + managed program ACV.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <StatCard value="2.4M" label="Endurance + Olympic-sport athletes in NA/EU competing 2+ events / yr" />
        <StatCard value="38%" label="Self-fund 100% of travel + entry · primary ARC persona" tone="primary" />
        <StatCard value="$1,200" label="Average annual athlete out-of-pocket sport spend" />
        <StatCard value="9.1%" label="Annual growth in sport sponsorship spend (IEG 2025)" />
      </div>

      <SourceBar>
        Sources: IEG / SponsorshipX 2025; USOPC, Canadian Sport Institute, World Athletics participation
        reports; ARC bottoms-up athlete model.
      </SourceBar>
    </SlideShell>
  ),
};
