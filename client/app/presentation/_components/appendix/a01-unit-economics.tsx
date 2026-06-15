import { SlideShell, StatCard, type Slide } from '../_shell';

export const a01UnitEconomics: Slide = {
  id: 'a01-unit-economics',
  title: 'Unit economics · crowdfunding wedge',
  section: 'appendix',
  render: () => (
    <SlideShell eyebrow="Appendix · Unit Economics">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Crowdfunding take-rate model · per athlete · 12-month cohort
      </h2>
      <p className="mt-2 max-w-4xl text-[14px] leading-snug text-on-surface-variant">
        Conservative assumptions on the wedge product alone. Sponsor + ambassador revenue is upside.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-3 gap-3">
        <StatCard value="$4,200" label="Average annual GMV per active athlete" />
        <StatCard value="6%" label="Platform take-rate (Stripe fees pass-through to backer)" tone="primary" />
        <StatCard value="$252" label="Annual platform revenue per active athlete" />
        <StatCard value="$38" label="Blended CAC per athlete (Year 1)" />
        <StatCard value="$1,260" label="5-year LTV per athlete (94% retention)" tone="primary" />
        <StatCard value="33x" label="LTV / CAC at steady state" />
      </div>

      <div className="mt-5 rounded-card border border-outline-variant/70 bg-surface-container-low p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Sensitivity to take-rate
        </p>
        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-left text-on-surface-variant">
              <th className="font-semibold">Take-rate</th>
              <th className="font-semibold">$ per athlete</th>
              <th className="font-semibold">10K athletes</th>
              <th className="font-semibold">50K athletes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            <tr className="text-on-surface">
              <td className="py-1.5">4%</td>
              <td>$168</td>
              <td>$1.68M</td>
              <td>$8.4M</td>
            </tr>
            <tr className="text-on-surface bg-primary-soft/30">
              <td className="py-1.5 font-bold text-primary">6% · base</td>
              <td className="font-bold">$252</td>
              <td className="font-bold">$2.52M</td>
              <td className="font-bold">$12.6M</td>
            </tr>
            <tr className="text-on-surface">
              <td className="py-1.5">8%</td>
              <td>$336</td>
              <td>$3.36M</td>
              <td>$16.8M</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SlideShell>
  ),
};
