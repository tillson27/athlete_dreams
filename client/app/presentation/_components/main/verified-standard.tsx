import { SlideShell, type Slide } from '../_shell';

const steps = [
  {
    number: '01',
    title: 'Identity & story',
    body: 'Government ID, social proof, and an editorially-reviewed athlete story. No anonymous campaigns.',
  },
  {
    number: '02',
    title: 'Career resume',
    body: 'Verified personal bests, results, and accomplishments pulled from federation databases and race timing.',
  },
  {
    number: '03',
    title: 'Synced journey',
    body: 'Optional Garmin, Strava, Apple Watch, Coros connections so backers see training output, not just promises.',
  },
  {
    number: '04',
    title: 'Receipts after',
    body: 'Post-event reconciliation: actual spend, race result, thank-you to each backer who covered each line.',
  },
];

export const verifiedStandardSlide: Slide = {
  id: 'verified-standard',
  title: 'The Verified Performer Standard',
  section: 'product',
  render: () => (
    <SlideShell eyebrow="Product · The Standard">
      <h2 className="max-w-5xl font-display text-3xl font-bold tracking-tight text-on-surface">
        An athlete profile, built like a financial record.
      </h2>
      <p className="mt-2 max-w-4xl text-[15px] leading-snug text-on-surface-variant">
        The Verified Performer Standard is ARC&rsquo;s four-step protocol. It is the moat: it makes every
        downstream product (crowdfunding, sponsorship, ambassador) trustworthy by construction.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex flex-col gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-5"
          >
            <span className="font-display text-5xl font-extrabold text-primary-soft">{step.number}</span>
            <h3 className="font-display text-lg font-bold leading-tight text-on-surface">{step.title}</h3>
            <p className="text-[12px] leading-relaxed text-on-surface-variant">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-card border border-outline-variant/70 bg-surface-container-lowest px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Athlete output</p>
          <p className="mt-1 font-display text-xl font-bold text-on-surface">A verified profile</p>
          <p className="text-[11px] text-on-surface-variant">Front-of-line in discovery; brand-safe by default.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Supporter output</p>
          <p className="mt-1 font-display text-xl font-bold text-on-surface">Receipt-grade trust</p>
          <p className="text-[11px] text-on-surface-variant">Where each dollar went, with proof.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Brand output</p>
          <p className="mt-1 font-display text-xl font-bold text-on-surface">Vetted roster</p>
          <p className="text-[11px] text-on-surface-variant">Audience + performance data on every athlete.</p>
        </div>
      </div>
    </SlideShell>
  ),
};
