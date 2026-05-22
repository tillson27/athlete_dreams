import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'ink';
type Size = 'sm' | 'md' | 'lg';

// Champion Flow button hierarchy:
//   primary    → Champion Orange container fill, the workhorse CTA.
//   secondary  → Olympic Blue outline on light surfaces (or paper-translucent on dark).
//   ghost      → text only, hover background tint.
//   inverse    → white pill on dark sections (CTA banner, hero overlays).
//   ink        → Stadium Charcoal fill (used on light-cards when orange is reserved).
const toneClasses: Record<Tone, string> = {
  primary:
    'bg-primary-container text-on-primary hover:bg-primary active:scale-[0.97] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-12px_rgba(171,54,0,0.45)]',
  secondary:
    'bg-transparent text-secondary ring-2 ring-inset ring-secondary hover:bg-secondary hover:text-on-secondary active:scale-[0.97]',
  ghost:
    'bg-transparent text-on-surface hover:bg-surface-container active:scale-[0.97]',
  inverse:
    'bg-white text-inverse-surface hover:bg-white/90 active:scale-[0.97]',
  ink:
    'bg-inverse-surface text-inverse-on-surface hover:bg-on-surface active:scale-[0.97]',
};

// Touch target ≥44px (WCAG 2.5.5).
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-10 px-4 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-7 py-3 text-base',
};

function classNames(tone: Tone, size: Size, extra?: string) {
  return [
    'inline-flex items-center justify-center gap-2 rounded-pill font-semibold tracking-tight',
    'transition-all duration-200 select-none whitespace-nowrap',
    toneClasses[tone],
    sizeClasses[size],
    extra ?? '',
  ].join(' ');
}

type CommonProps = {
  tone?: Tone;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  tone = 'primary',
  size = 'md',
  className,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return <button {...rest} className={classNames(tone, size, className)} />;
}

export function LinkButton({
  tone = 'primary',
  size = 'md',
  className,
  href,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>) {
  return (
    <Link {...rest} href={href} className={classNames(tone, size, className)}>
      {children}
    </Link>
  );
}

export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className ?? 'h-4 w-4'}
    >
      <path
        d="M4 10h12m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
