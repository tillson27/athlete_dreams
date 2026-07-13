import Link from 'next/link';
import { formatCents } from '@/lib/format';
import { Reveal } from '@/components/site/Reveal';
import { Icon } from '@/components/ui/Icon';
import { ledgerLines, ledgerTotalCents } from '@/lib/homeContent';

export function BackingTeaserSection() {
  return (
    <section className="border-y border-outline-variant bg-surface-container-low py-24">
      <Reveal>
        <div className="mx-auto mb-16 w-full max-w-[var(--spacing-container-max)] px-5 text-center md:px-16">
          <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
            Backing your favourite runners is coming.
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            We&rsquo;re launching story-first, with crowdfunding coming next. You&rsquo;ll be able
            to fund a specific race, trip, gear purchase, or training block — chip in one-time or
            back an athlete&rsquo;s whole season, and see exactly where every dollar lands. Athletes
            keep their supporters updated with post-event recaps, so crowdfunding here feels less
            like a donation and more like being part of the team.
          </p>
        </div>
      </Reveal>
      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col items-start gap-6 rounded-card border border-outline-variant bg-white p-8 shadow-sm md:flex-row">
            <div className="flex-1">
              <Icon name="fact-check" className="mb-4 h-8 w-8 text-primary" />
              <h4 className="mb-3 font-display text-xl font-bold text-on-surface">
                See where every dollar goes
              </h4>
              <p className="text-on-surface-variant">
                Every campaign is an itemized season — race entries, travel, coaching, gear. Back
                the exact line you want, and athletes prove each expense with{' '}
                <strong className="font-bold text-on-surface">receipts</strong> and post-event
                updates. No black box, no guessing.
              </p>
            </div>
            <div className="w-full rounded-input bg-surface-container p-4 text-sm md:w-72">
              <div className="mb-1 flex items-center justify-between">
                <span className="eyebrow text-on-surface-variant">Where your dollars go</span>
              </div>
              {ledgerLines.map((line) => (
                <div key={line.label} className="border-t border-outline-variant/60 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-on-surface">{line.label}</span>
                    <span className="shrink-0 font-bold text-on-surface">
                      {formatCents(line.amountCents)}
                    </span>
                  </div>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${
                      line.receipt ? 'text-success' : 'text-on-surface-variant'
                    }`}
                  >
                    {line.receipt ? (
                      <>
                        <Icon name="check-badge" className="h-3.5 w-3.5" />
                        Receipt attached
                      </>
                    ) : (
                      <>
                        <Icon name="timer" className="h-3.5 w-3.5" />
                        Receipt after the event
                      </>
                    )}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t-2 border-outline-variant pt-2 font-bold text-on-surface">
                <span>Season total</span>
                <span>{formatCents(ledgerTotalCents)}</span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Icon name="shield-check" className="h-4 w-4 shrink-0 text-success" />
                Every expense traced to a receipt.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-card bg-inverse-surface p-8 text-white shadow-sm">
            <Icon name="heart" className="mb-6 h-9 w-9 text-primary-container" />
            <h4 className="mb-4 font-display text-2xl font-bold">
              Until then, follow the journey.
            </h4>
            <p className="text-lg leading-relaxed text-white/80">
              The runners you follow today are the ones you&rsquo;ll be able to back tomorrow —
              and they&rsquo;ll see you in their corner from day one.
            </p>
            <Link
              href="/support"
              className="label-bold mt-6 inline-flex w-fit items-center gap-2 rounded-button bg-primary-container px-6 py-3 text-on-primary transition-colors hover:bg-primary"
            >
              How backing will work
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
