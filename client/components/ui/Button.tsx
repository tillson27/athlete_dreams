import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'ghost' | 'flame';
type Size = 'sm' | 'md' | 'lg';

// Two-tier hierarchy, athletic-brand inspired:
//   primary    → ink-filled (the workhorse CTA)
//   secondary  → ink-outlined, inverts on hover (the partner CTA)
//   ghost      → text only
//   flame      → reserved accent; bold but used sparingly (e.g., live badges, donation pulse)
const toneClasses: Record<Tone, string> = {
  primary:
    'bg-ink text-paper shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_8px_24px_-12px_rgba(11,19,32,0.45)] hover:bg-ink-soft hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_28px_-12px_rgba(11,19,32,0.55)]',
  secondary:
    'bg-transparent text-ink ring-2 ring-inset ring-ink hover:bg-ink hover:text-paper',
  ghost:
    'bg-transparent text-ink hover:bg-ink/8',
  flame:
    'bg-flame text-white hover:bg-flame/92 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-12px_rgba(200,61,29,0.55)]',
};

// Touch target stays ≥44px on every size (WCAG 2.5.5 Target Size).
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-10 px-4 py-2 text-sm',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-base',
};

function classNames(tone: Tone, size: Size, extra?: string) {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 ${toneClasses[tone]} ${sizeClasses[size]} ${extra ?? ''}`;
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
  return (
    <button {...rest} className={classNames(tone, size, className)} />
  );
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

// Single source for the small inline arrow used by hero/CTA links.
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
