import Link from 'next/link';
import {
  BRAND_ARC_COLOR,
  BRAND_INK_COLOR,
  BRAND_MARK_ARC_PATH,
  BRAND_MARK_LETTER_PATH,
  BRAND_MARK_VIEW_BOX,
  BRAND_PAPER_COLOR,
} from '@/lib/brand';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'short' | 'full';
type LogoTone = 'dark' | 'light';

const markSizeClassName: Record<LogoSize, string> = {
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-10 w-auto',
};

const wordmarkSizeClassName: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

function ArcMark({ className, tone }: { className?: string; tone: LogoTone }) {
  return (
    <svg viewBox={BRAND_MARK_VIEW_BOX} aria-hidden="true" className={className}>
      <path
        d={BRAND_MARK_LETTER_PATH}
        fill={tone === 'dark' ? BRAND_INK_COLOR : BRAND_PAPER_COLOR}
      />
      <path d={BRAND_MARK_ARC_PATH} fill={BRAND_ARC_COLOR} />
    </svg>
  );
}

/**
 * Mark plus wordmark with no link wrapper. Use inside transactional flows
 * (registration) where navigating away mid-task is not wanted.
 */
export function LogoLockup({
  size = 'md',
  variant = 'short',
  tone = 'dark',
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  tone?: LogoTone;
}) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <ArcMark tone={tone} className={`${markSizeClassName[size]} shrink-0`} />
      <span
        className={`whitespace-nowrap font-display font-extrabold leading-none tracking-[0.02em] ${wordmarkSizeClassName[size]} ${
          tone === 'dark' ? 'text-on-surface' : 'text-white'
        }`}
      >
        {variant === 'full' ? <span className="hidden sm:inline">ATHLETE </span> : null}
        ARC
      </span>
    </span>
  );
}

export function Logo({
  size = 'md',
  variant = 'short',
  tone = 'dark',
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  tone?: LogoTone;
}) {
  return (
    <Link href="/" aria-label="Athlete Arc home" className="flex min-h-11 items-center">
      <LogoLockup size={size} variant={variant} tone={tone} />
    </Link>
  );
}
