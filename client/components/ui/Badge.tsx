import type { ReactNode } from 'react';

type Tone =
  | 'primary'
  | 'primary-soft'
  | 'secondary'
  | 'secondary-soft'
  | 'success'
  | 'live'
  | 'inverse'
  | 'soft';

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary text-on-primary',
  'primary-soft': 'bg-primary-soft text-on-primary-container',
  secondary: 'bg-secondary text-on-secondary',
  'secondary-soft': 'bg-secondary-soft text-on-secondary-container',
  success: 'bg-success text-white',
  live: 'bg-primary-container text-on-primary',
  inverse: 'bg-inverse-surface text-inverse-on-surface',
  soft: 'bg-surface-container text-on-surface',
};

export function Badge({
  children,
  tone = 'soft',
  uppercase = true,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold tracking-[0.05em]',
        uppercase ? 'uppercase' : '',
        toneClasses[tone],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

// Pulsing dot used inside live-funding badges.
export function LiveDot({ tone = 'on-primary' }: { tone?: 'on-primary' | 'on-secondary' }) {
  return (
    <span
      aria-hidden="true"
      className={`pulse-live inline-block h-1.5 w-1.5 rounded-full ${
        tone === 'on-primary' ? 'bg-white' : 'bg-secondary'
      }`}
    />
  );
}

// Green check verified pill that sits over hero photography.
export function VerifiedChip({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="glass-effect inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold tracking-[0.05em] text-on-surface">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-success" aria-hidden="true">
        <path
          d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z"
          fill="currentColor"
        />
      </svg>
      <span>{label}</span>
    </span>
  );
}
