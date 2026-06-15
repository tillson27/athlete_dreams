import { Sparkles } from '../icons';
import type { Slide } from '../_shell';

export const coverSlide: Slide = {
  id: 'cover',
  title: 'Cover',
  section: 'story',
  render: () => (
    <div className="relative flex h-full w-full flex-col justify-between gap-6 overflow-hidden bg-inverse-surface px-16 py-14 text-white">
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,95,31,0.22),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(4,83,205,0.22),transparent_60%)]"
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-card bg-primary-container text-base font-extrabold text-on-primary">
          F
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold text-white">FAD Network</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/55">Investor Brief</span>
        </div>
      </div>

      <div className="relative">
        <p className="mb-4 inline-flex items-center gap-2 rounded-pill border border-primary-container/40 bg-primary-container/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-container">
          <Sparkles className="h-3 w-3" />
          Pre-Seed · Confidential · 2026
        </p>
        <h1 className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight text-white">
          Back the dream,
          <br />
          <span className="bg-gradient-to-r from-secondary-container to-primary-container bg-clip-text text-transparent">
            not the middleman.
          </span>
        </h1>
        <p className="mt-6 max-w-3xl text-xl leading-snug text-white/75">
          FAD Network is the world&rsquo;s most transparent funding platform for athletes &mdash; crowdfunding,
          corporate sponsorship, and managed ambassador programs on one ledger.
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">
            Wedge
          </p>
          <p className="mt-1 text-[13px] font-bold text-white">Event-based crowdfunding</p>
          <p className="mt-0.5 text-[11px] text-white/65">
            Itemized campaigns, OCR-verified receipts, sub-24h Stripe payouts.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">
            Moat
          </p>
          <p className="mt-1 text-[13px] font-bold text-white">Verified Performer Standard</p>
          <p className="mt-0.5 text-[11px] text-white/65">
            Identity, results, training data, post-event reconciliation.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">
            Phase II
          </p>
          <p className="mt-1 text-[13px] font-bold text-white">Sponsor + ambassador marketplace</p>
          <p className="mt-0.5 text-[11px] text-white/65">
            Brand-side discovery, contracting, ROI reporting.
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-6 text-sm text-white/65">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">Founder</span>
          <span className="text-white">Josh Tillson</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/45">Confidential</span>
          <span className="text-white">fad.network</span>
        </div>
      </div>
    </div>
  ),
};
