import Link from 'next/link';

// Compact mark — abstract "FAD" lockup: a chevron path-to-glory arrow.
function FadMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={className}>
      <rect width="36" height="36" rx="10" fill="var(--color-primary)" />
      <path
        d="M9 25 18 11l9 14h-5.6l-3.4-5.4L14.6 25H9Z"
        fill="#fff"
      />
      <path
        d="M21.4 19.6 27 25"
        stroke="var(--color-primary-container)"
        strokeWidth="2.4"
        strokeLinecap="round"
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
      aria-label="FAD Network home"
      className="flex items-center gap-2.5 select-none"
    >
      <FadMark className={`${markSize[size]} shrink-0`} />
      <span className={`font-display font-extrabold leading-none tracking-tight ${textSize[size]} ${textTone}`}>
        {variant === 'full' ? 'FAD Network' : 'FAD'}
      </span>
    </Link>
  );
}
