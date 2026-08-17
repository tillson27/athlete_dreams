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
  // Mobile gets a tighter rhythm than desktop — at 390px wide, desktop's
  // section gaps push every section past a full screen of dead space.
  const padClass = {
    sm: 'py-8 md:py-14',
    md: 'py-12 md:py-20',
    lg: 'py-14 md:py-24',
    xl: 'py-16 md:py-32',
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
    <p className={`eyebrow text-on-surface ${className ?? ''}`}>{children}</p>
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
          className={`eyebrow ${onDark ? 'text-primary-container' : 'text-on-surface'}`}
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
