import type { ReactNode } from 'react';

export function Section({
  children,
  className,
  contained = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  contained?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className ?? ''}`}>
      {contained ? (
        <div className="mx-auto w-full max-w-7xl px-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={`max-w-3xl space-y-4 ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="font-display text-balance text-4xl leading-tight md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-lg leading-relaxed text-ink/70">{description}</p>
      ) : null}
    </div>
  );
}
