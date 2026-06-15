import { SlideShell, type Slide } from '../_shell';
import { Check, Wallet } from '../icons';

const ledgerLines = [
  { label: 'Race entry · Tokyo Marathon', amount: '$320', tag: 'Stripe verified' },
  { label: 'Flight · YYZ → HND (economy)', amount: '$1,680', tag: 'OCR receipt' },
  { label: 'Lodging · race village, 4 nights', amount: '$840', tag: 'Stripe verified' },
  { label: 'Recovery + physio (pre-race)', amount: '$400', tag: 'OCR receipt' },
  { label: 'Race-day nutrition + kit', amount: '$120', tag: 'OCR receipt' },
];

export const transparencySlide: Slide = {
  id: 'transparency',
  title: 'Radical transparency · the receipt',
  section: 'product',
  render: () => (
    <SlideShell eyebrow="Product · Radical Transparency">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        The receipt is the product.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        Every campaign is itemized before launch and reconciled after the event. Backers see exactly what they
        funded and where it went. This is what unlocks repeat giving and brand trust.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-12 gap-4">
        <div className="col-span-7 flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-base font-bold text-on-surface">
                  Live ledger · Tokyo Marathon 2026
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  Real-time expense auditing for backers
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live sync
            </span>
          </div>

          <div className="mt-1 space-y-2">
            {ledgerLines.map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between rounded-card border border-outline-variant/60 bg-surface-container-lowest px-4 py-3"
              >
                <div>
                  <p className="text-[13px] font-semibold text-on-surface">{line.label}</p>
                  <p className="text-[10px] uppercase tracking-wider text-secondary">{line.tag}</p>
                </div>
                <p className="font-display text-base font-bold text-on-surface">{line.amount}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-card border border-dashed border-outline-variant/70 bg-white px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">Total ask</span>
              <span className="font-display text-base font-bold text-on-surface">$3,360</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">Raised · 48 backers</span>
              <span className="font-display text-base font-bold text-primary">$1,840 · 55%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-surface-container">
              <div className="progress-gradient h-full rounded-pill" style={{ width: '55%' }} />
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Why this matters</p>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Transparency drives the second donation.
            </h3>
            <p className="text-[12px] leading-relaxed text-on-primary-container/85">
              Donors who see a post-event recap with reconciled spend give again at a 3.4x rate vs. donors who
              hear nothing back. The receipt is the loop close that compounds LTV.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              The protocol
            </p>
            <ul className="space-y-2">
              {[
                'Pre-launch budget review by FAD ops',
                'OCR-verified receipts on every itemized line',
                'Stripe Connect direct-to-athlete (no float)',
                'Post-event recap, signed by the athlete',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[12px] leading-snug text-on-surface-variant">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideShell>
  ),
};
