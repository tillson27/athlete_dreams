import { SlideShell, type Slide } from '../_shell';
import { Check, X } from '../icons';

const competitors = [
  {
    name: 'ARC Network',
    sport: 'Yes',
    transparency: 'Yes',
    sponsorship: 'Yes',
    payouts: '<24h',
    standout: true,
  },
  {
    name: 'GoFundMe',
    sport: 'Generic',
    transparency: 'No',
    sponsorship: 'No',
    payouts: '2-5d',
    standout: false,
  },
  {
    name: 'OpenSponsorship',
    sport: 'Yes',
    transparency: 'No',
    sponsorship: 'Yes',
    payouts: 'Net-30+',
    standout: false,
  },
  {
    name: 'Athlytic / MakeAChamp',
    sport: 'Yes',
    transparency: 'Partial',
    sponsorship: 'No',
    payouts: '5-10d',
    standout: false,
  },
  {
    name: 'Patreon (athlete use)',
    sport: 'No',
    transparency: 'No',
    sponsorship: 'No',
    payouts: '7d',
    standout: false,
  },
];

function Cell({ value }: { value: string }) {
  if (value === 'Yes') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (value === 'No') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-on-surface/10 text-on-surface-variant/60">
        <X className="h-3 w-3" />
      </span>
    );
  }
  return <span className="text-[12px] text-on-surface-variant">{value}</span>;
}

export const a02Competition: Slide = {
  id: 'a02-competition',
  title: 'Competitive landscape',
  section: 'appendix',
  render: () => (
    <SlideShell eyebrow="Appendix · Competition">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        No one does athlete-vertical crowdfunding + sponsorship on a transparent payout rail.
      </h2>
      <p className="mt-2 max-w-4xl text-[14px] leading-snug text-on-surface-variant">
        Each adjacent player owns one slice; none own the verified-profile substrate that ARC uses to compound
        across three revenue products.
      </p>

      <div className="mt-5 rounded-card border border-outline-variant/70 bg-surface-container-lowest p-5">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-on-surface-variant">
              <th className="pb-2 font-semibold">Platform</th>
              <th className="pb-2 font-semibold">Sport-focused</th>
              <th className="pb-2 font-semibold">Receipt-grade transparency</th>
              <th className="pb-2 font-semibold">Sponsor marketplace</th>
              <th className="pb-2 font-semibold">Athlete payout speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {competitors.map((row) => (
              <tr
                key={row.name}
                className={
                  row.standout ? 'bg-primary-soft/30 text-on-surface' : 'text-on-surface'
                }
              >
                <td className="py-3 font-bold">
                  {row.standout ? <span className="text-primary">{row.name}</span> : row.name}
                </td>
                <td>
                  <Cell value={row.sport} />
                </td>
                <td>
                  <Cell value={row.transparency} />
                </td>
                <td>
                  <Cell value={row.sponsorship} />
                </td>
                <td>{row.payouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-on-surface-variant">
        <span className="font-bold text-on-surface">Note:</span> Adjacent enterprise-ambassador shops (Octagon,
        Wasserman, Endeavor) are services businesses, not platforms. They are partners or acquirers, not
        competitors on the product surface.
      </p>
    </SlideShell>
  ),
};
