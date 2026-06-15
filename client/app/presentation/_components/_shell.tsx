import type { ReactNode } from 'react';

export type SlideSectionKey =
  | 'story'
  | 'product'
  | 'market'
  | 'vision'
  | 'team'
  | 'ask'
  | 'appendix';

export type Slide = {
  id: string;
  title: string;
  section: SlideSectionKey;
  render: () => ReactNode;
};

export const slideSections: ReadonlyArray<{ key: SlideSectionKey; label: string }> = [
  { key: 'story', label: 'Story' },
  { key: 'product', label: 'Product & Moat' },
  { key: 'market', label: 'Market & Traction' },
  { key: 'vision', label: 'Vision' },
  { key: 'team', label: 'Team' },
  { key: 'ask', label: 'The Ask' },
  { key: 'appendix', label: 'Appendix' },
];

export function SlideShell({
  eyebrow,
  children,
  className,
  tone = 'light',
}: {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const bg: string =
    tone === 'dark'
      ? 'bg-inverse-surface text-white'
      : 'bg-surface-container-lowest text-on-surface';
  return (
    <div className={`flex h-full w-full flex-col ${bg} px-14 pb-[44px] pt-9 ${className ?? ''}`}>
      {eyebrow ? (
        <p
          className={
            tone === 'dark'
              ? 'mb-4 inline-flex w-fit items-center gap-2 rounded-pill bg-primary-container/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-container'
              : 'mb-4 inline-flex w-fit items-center gap-2 rounded-pill bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary'
          }
        >
          <span
            aria-hidden="true"
            className={
              tone === 'dark'
                ? 'h-1.5 w-1.5 rounded-full bg-primary-container'
                : 'h-1.5 w-1.5 rounded-full bg-primary'
            }
          />
          {eyebrow}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function StatCard({
  value,
  label,
  tone = 'light',
}: {
  value: string;
  label: string;
  tone?: 'light' | 'dark' | 'primary';
}) {
  const container: string =
    tone === 'dark'
      ? 'rounded-2xl border border-white/10 bg-white/[0.04] p-4'
      : tone === 'primary'
        ? 'rounded-2xl border border-primary/20 bg-primary-soft/40 p-4'
        : 'rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4';
  const valueClass: string =
    tone === 'dark' ? 'text-white' : tone === 'primary' ? 'text-on-primary-container' : 'text-on-surface';
  const labelClass: string =
    tone === 'dark' ? 'text-white/65' : tone === 'primary' ? 'text-on-primary-container/80' : 'text-on-surface-variant';
  return (
    <div className={container}>
      <p className={`font-display text-3xl font-extrabold tracking-tight ${valueClass}`}>{value}</p>
      <p className={`mt-1 text-sm leading-snug ${labelClass}`}>{label}</p>
    </div>
  );
}

export function FeatureTile({
  icon,
  title,
  description,
  accent = false,
  tone = 'light',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  accent?: boolean;
  tone?: 'light' | 'dark';
}) {
  const container: string =
    tone === 'dark'
      ? accent
        ? 'rounded-2xl border border-primary-container/40 bg-primary-container/10 p-4'
        : 'rounded-2xl border border-white/10 bg-white/[0.04] p-4'
      : accent
        ? 'rounded-2xl border border-primary/30 bg-primary-soft/30 p-4 card-lift'
        : 'rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 card-lift';
  const titleColor: string = tone === 'dark' ? 'text-white' : 'text-on-surface';
  const bodyColor: string = tone === 'dark' ? 'text-white/70' : 'text-on-surface-variant';
  const iconBg: string =
    tone === 'dark' ? 'bg-primary-container/15 text-primary-container' : 'bg-primary/10 text-primary';
  return (
    <div className={container}>
      <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </span>
      <h4 className={`text-sm font-bold ${titleColor}`}>{title}</h4>
      <p className={`mt-1 text-[12px] leading-relaxed ${bodyColor}`}>{description}</p>
    </div>
  );
}

export function SourceBar({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p
      className={
        tone === 'dark'
          ? 'mt-3 text-[10px] leading-snug text-white/55'
          : 'mt-3 text-[10px] leading-snug text-on-surface-variant/80'
      }
    >
      {children}
    </p>
  );
}
