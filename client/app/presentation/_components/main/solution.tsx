import { FeatureTile, SlideShell, type Slide } from '../_shell';
import { Megaphone, Receipt, ShieldCheck, Trophy, Users, Wallet } from '../icons';

export const solutionSlide: Slide = {
  id: 'solution',
  title: 'The FAD solution',
  section: 'story',
  render: () => (
    <SlideShell eyebrow="The Solution">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        One network. Three pillars. Built on a single verified athlete profile.
      </h2>
      <p className="mt-2 max-w-5xl text-[15px] leading-snug text-on-surface-variant">
        Every athlete on FAD passes through a four-step verification protocol. From that single source of
        truth, three revenue products operate &mdash; in priority order &mdash; with shared trust and shared data.
      </p>

      <div className="mt-5 grid flex-1 grid-cols-3 gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Megaphone className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Pillar 01 · The wedge</p>
          </div>
          <h3 className="font-display text-lg font-bold text-on-surface">Crowdfunding</h3>
          <p className="text-[12px] leading-relaxed text-on-primary-container/85">
            Itemized, event-based campaigns with OCR-verified receipts and sub-24h direct payouts via Stripe
            Connect. Backers fund a specific line: a flight, an entry fee, a coaching block.
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-on-primary-container/80">
            <li>· Pre-launch budget review</li>
            <li>· Live ledger on every campaign</li>
            <li>· Post-event reconciliation + recap</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-secondary-soft/40 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-on-secondary">
              <Trophy className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">Pillar 02 · Margin</p>
          </div>
          <h3 className="font-display text-lg font-bold text-on-surface">Corporate sponsorship</h3>
          <p className="text-[12px] leading-relaxed text-on-secondary-container">
            Brand-side discovery on the same verified profiles. Search by sport, region, audience, values.
            Connect directly with no agency middleman. Contract and report in-platform.
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-on-secondary-container/85">
            <li>· Brand-safety review per athlete</li>
            <li>· In-platform contracting workflow</li>
            <li>· Performance + content ROI tracking</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-inverse-surface text-white">
              <Users className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Pillar 03 · Enterprise
            </p>
          </div>
          <h3 className="font-display text-lg font-bold text-on-surface">Ambassador programs</h3>
          <p className="text-[12px] leading-relaxed text-on-surface-variant">
            FAD operates ambassador discovery, intake, contracting, and compliance for enterprise rosters.
            Brand teams focus on the storytelling. We handle the operational floor underneath.
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-on-surface-variant">
            <li>· White-label intake forms</li>
            <li>· Cohort-level reporting</li>
            <li>· Roster turnover + renewal ops</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <FeatureTile
          icon={<Receipt className="h-4 w-4" />}
          title="Receipt-grade transparency"
          description="OCR receipts, public ledger, line-item reconciliation."
        />
        <FeatureTile
          icon={<Wallet className="h-4 w-4" />}
          title="Stripe Connect rails"
          description="Sub-24h payouts. PCI-DSS Level 1. No platform float."
          accent
        />
        <FeatureTile
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Verified Performer Standard"
          description="Identity + results + training data + post-event recap."
        />
      </div>
    </SlideShell>
  ),
};
