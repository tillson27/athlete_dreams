import Link from 'next/link';

function ArcMark({ className, tone }: { className?: string; tone: 'dark' | 'light' }) {
  const shellFill = tone === 'dark' ? 'var(--color-inverse-surface)' : 'rgba(255, 255, 255, 0.96)';
  const strideFill = tone === 'dark' ? 'var(--color-surface-bright)' : 'var(--color-inverse-surface)';

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="36" height="36" rx="8" fill={shellFill} />
      <path
        d="M7 25.5C10.5 14.4 20.2 7.8 33.5 7.5"
        fill="none"
        stroke="var(--color-primary-container)"
        strokeLinecap="round"
        strokeWidth="4.2"
      />
      <path
        d="M11.5 30.5 18.9 14.2c.5-1.2 2.1-1.2 2.7 0l7.2 16.3h-5.1l-3.5-8.2-3.6 8.2h-5.1Z"
        fill={strideFill}
      />
      <path
        d="M16.4 24.4c3.9-1.5 7.6-1.2 11 .8"
        fill="none"
        stroke="var(--color-primary)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M26.6 13.5 32 18"
        fill="none"
        stroke="var(--color-primary-container)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  variant = 'short',
  tone = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'short' | 'full';
  tone?: 'dark' | 'light';
}) {
  const markSize: Record<string, string> = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-10 w-10' };
  const textSize: Record<string, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };
  const textTone = tone === 'dark' ? 'text-on-surface' : 'text-white';

  return (
    <Link
      href="/"
      aria-label="ARC home"
      className="flex min-h-11 items-center gap-2.5 select-none"
    >
      <ArcMark tone={tone} className={`${markSize[size]} shrink-0`} />
      <span
        className={`whitespace-nowrap font-display font-extrabold leading-none ${textSize[size]} ${textTone}`}
      >
        ARC
        {variant === 'full' ? <span className="hidden sm:inline"> Network</span> : null}
      </span>
    </Link>
  );
}
