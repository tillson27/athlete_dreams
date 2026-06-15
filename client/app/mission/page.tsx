import type { Metadata } from 'next';
import Link from 'next/link';
import { LinkButton, ArrowGlyph } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'The MVP',
  description:
    'ARC in one screen: what we do, how it works, and why the receipt is the product.',
  openGraph: {
    title: 'The MVP · ARC',
    description:
      'Crowdfund a verified athlete on a transparent ledger. Every dollar named. Every receipt posted.',
  },
};

const pillars = [
  {
    step: '01',
    title: 'Itemized ask',
    body: 'Flights, entry, lodging, gear — each line is its own number.',
  },
  {
    step: '02',
    title: 'Direct payout',
    body: 'Stripe Connect to the athlete in under 24 hours. No platform float.',
  },
  {
    step: '03',
    title: 'Post-event receipt',
    body: 'Actual spend, OCR-verified, named back to the backer who covered it.',
  },
];

export default function MissionPage() {
  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-center overflow-hidden bg-inverse-surface px-5 py-12 text-white md:px-12 md:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-primary-container/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-secondary-container/20 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            The MVP, on one page
          </span>

          <h1 className="mt-6 font-display text-balance text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl">
            Back a real athlete.
            <br />
            <span className="text-primary-container">See every dollar work.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            ARC is event-based crowdfunding for verified athletes. Pick a campaign, fund a specific
            line item, and get an itemized receipt when the race is done. That&rsquo;s it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/athletes" tone="primary" size="lg" className="group">
              Browse athletes
              <ArrowGlyph className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </LinkButton>
            <Link
              href="/how-it-works"
              className="text-sm font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline"
            >
              How it works →
            </Link>
          </div>
        </div>

        <ol className="relative flex flex-col gap-3">
          {pillars.map((pillar) => (
            <li
              key={pillar.step}
              className="rounded-card border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-primary-container/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-display text-2xl font-extrabold text-primary-container/90">
                  {pillar.step}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{pillar.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{pillar.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative mx-auto mt-10 max-w-[1200px] text-xs text-white/55">
        Verified athlete · itemized campaign · sub-24h payout · post-event receipt.
        The receipt is the product.
      </p>
    </section>
  );
}
