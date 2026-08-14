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
  'secondary-soft': 'bg-secondary-soft text-on-surface',
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
