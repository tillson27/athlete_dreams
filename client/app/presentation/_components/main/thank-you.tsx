import type { Slide } from '../_shell';

export const thankYouSlide: Slide = {
  id: 'thank-you',
  title: 'Thank you',
  section: 'ask',
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

      <div className="relative max-w-3xl">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary-container">Thank you</p>
        <h1 className="mt-4 font-display text-7xl font-extrabold leading-[0.95] tracking-tight text-white">
          Back the dream.
          <br />
          <span className="bg-gradient-to-r from-secondary-container to-primary-container bg-clip-text text-transparent">
            Build the network.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug text-white/75">
          Questions, follow-ups, or intros? We move fast and we&rsquo;d love to keep the conversation going.
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">Founder</p>
          <p className="mt-1 text-[13px] font-bold text-white">Josh Tillson</p>
          <p className="mt-0.5 text-[11px] text-white/65">tillson27@gmail.com</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">Mission</p>
          <p className="mt-1 text-[13px] font-bold text-white">fad.network/mission</p>
          <p className="mt-0.5 text-[11px] text-white/65">The long-form story behind FAD.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container">Live product</p>
          <p className="mt-1 text-[13px] font-bold text-white">fad.network/athletes</p>
          <p className="mt-0.5 text-[11px] text-white/65">Browse the verified athlete roster.</p>
        </div>
      </div>
    </div>
  ),
};
