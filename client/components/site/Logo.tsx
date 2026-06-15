import Link from 'next/link';

function ArcMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={className}>
      <rect width="36" height="36" rx="10" fill="var(--color-primary)" />
      <path
        d="M8.5 26 18 9.5 27.5 26h-5.4L18 18.4 13.9 26H8.5Z"
        fill="#fff"
      />
      <path
        d="M11 21.5h14"
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
      aria-label="ARC home"
      className="flex items-center gap-2.5 select-none"
    >
      <ArcMark className={`${markSize[size]} shrink-0`} />
      <span className={`font-display font-extrabold leading-none tracking-tight ${textSize[size]} ${textTone}`}>
        {variant === 'full' ? 'ARC Network' : 'ARC'}
      </span>
    </Link>
  );
}
