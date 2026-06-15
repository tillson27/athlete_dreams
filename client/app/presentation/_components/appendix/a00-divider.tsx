import type { Slide } from '../_shell';

export const a00Divider: Slide = {
  id: 'a00-divider',
  title: 'Appendix',
  section: 'appendix',
  render: () => (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden bg-inverse-surface px-16 py-14 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,95,31,0.18),transparent_55%)]"
      />
      <p className="relative text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">
        Appendix
      </p>
      <h1 className="relative max-w-3xl text-center font-display text-7xl font-extrabold leading-[0.95] tracking-tight text-white">
        Deeper cuts &amp; references.
      </h1>
      <p className="relative max-w-2xl text-center text-lg text-white/70">
        Unit economics, competitive landscape, product detail, sources.
      </p>
    </div>
  ),
};
