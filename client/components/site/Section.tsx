import type { ReactNode } from 'react';

type Tone = 'surface' | 'surface-low' | 'surface-bright' | 'inverse' | 'transparent';

const toneClasses: Record<Tone, string> = {
  surface: 'bg-surface',
  'surface-low': 'bg-surface-container-low',
  'surface-bright': 'bg-surface-container-lowest',
  inverse: 'bg-inverse-surface text-inverse-on-surface',
  transparent: '',
};

export function Section({
  children,
  className,
  contained = true,
  tone = 'transparent',
  id,
  pad = 'lg',
}: {
  children: ReactNode;
  className?: string;
  contained?: boolean;
  tone?: Tone;
  id?: string;
  pad?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const padClass = {
    sm: 'py-10 md:py-14',
    md: 'py-14 md:py-20',
    lg: 'py-20 md:py-24',
    xl: 'py-24 md:py-32',
  }[pad];

  return (
    <section
      id={id}
      className={`${toneClasses[tone]} ${padClass} ${className ?? ''}`}
    >
      {contained ? (
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`label-bold text-primary ${className ?? ''}`}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  onDark?: boolean;
}) {
  return (
    <div
      className={`max-w-3xl space-y-4 ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      {eyebrow ? (
        <p
          className={`label-bold ${onDark ? 'text-primary-container' : 'text-primary'}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-display text-balance text-3xl font-bold leading-tight md:text-4xl lg:text-5xl ${
          onDark ? 'text-white' : 'text-on-surface'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`text-lg leading-relaxed ${
            onDark ? 'text-white/75' : 'text-on-surface-variant'
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
