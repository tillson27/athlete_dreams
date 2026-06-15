import { SlideShell, SourceBar, StatCard, type Slide } from '../_shell';
import { Megaphone, ShieldCheck, Wallet } from '../icons';

export const problemSlide: Slide = {
  id: 'problem',
  title: 'The athletic funding gap',
  section: 'story',
  render: () => (
    <SlideShell eyebrow="The Problem">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        Athletes lose the funding fight in three predictable places.
      </h2>
      <p className="mt-2 max-w-5xl text-[15px] leading-snug text-on-surface-variant">
        Posts are scattered, donations are opaque, and gatekeepers keep most of the money. The people who
        want to back athletes &mdash; family, fans, brands &mdash; are the worst served by the current system.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-3 gap-4">
        <div className="flex flex-col rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              The Shadow Journey
            </p>
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-on-surface">
            No home for the full story.
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
            Athletes scatter their work across Strava, Instagram, federation pages, and personal sites. Backers
            see highlights but never the daily grind, gear failures, or admin milestones that compound into
            real career value.
          </p>
          <div className="mt-auto pt-3">
            <StatCard
              value="89%"
              label="of supporters say they would give more if they saw the athlete's full story (FAD athlete survey, n=120)"
            />
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              The Trust Gap
            </p>
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-on-surface">
            Opaque crowdfunding kills donor confidence.
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
            Generic tip jars and &ldquo;support my journey&rdquo; pages leave supporters guessing. No
            verification, no receipts, no post-event reconciliation. High-net-worth backers and institutions
            stop giving once burned.
          </p>
          <div className="mt-auto pt-3">
            <StatCard
              value="73%"
              label="of recurring sport donors say lack of visibility was their main reason for stopping (FAD donor interviews)"
            />
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              The Middleman Tax
            </p>
          </div>
          <h3 className="mt-3 font-display text-lg font-bold text-on-surface">
            Pennies on the dollar reach the athlete.
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
            Federations, agencies, and legacy sponsorship platforms keep most of every sponsorship dollar. The
            athlete &mdash; the person doing the work &mdash; is the last to be paid.
          </p>
          <div className="mt-auto pt-3">
            <StatCard
              value="~30%"
              label="industry estimate for the share of a typical sponsorship dollar that actually reaches the athlete"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-card border border-primary/20 bg-primary/5 px-4 py-2.5">
        <p className="text-[12px] leading-relaxed text-on-surface/85">
          <span className="font-bold text-on-surface">Anchor:</span> A single $3,000 race trip funded directly
          through FAD is worth more to the athlete than $10,000 routed through a traditional sponsorship
          agency. The math compounds across a career.
        </p>
      </div>

      <SourceBar>
        Sources: FAD athlete + donor research (n=120 athletes, 38 recurring donors, 2025-2026); industry
        sponsorship benchmarks (IEG / SponsorshipX 2025).
      </SourceBar>
    </SlideShell>
  ),
};
