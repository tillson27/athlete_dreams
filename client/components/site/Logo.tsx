import Link from 'next/link';

function ShoeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-24 -18 210 136" aria-hidden="true" overflow="visible" className={className}>
      <path
        fill="#f13a1f"
        d="M54 18c8 20 22 27 42 18 6-3 13 1 16 8l4 12c5 16 18 24 34 27 3 .6 5 3 5 6 0 4-3 7-7 7H57c-8 0-14-2-20-7L18 73c-4-4-4-10 0-14 12-10 22-23 30-40 1-3 5-4 6-1Z"
      />
      <path
        fill="#cf260f"
        d="M53 18c8 20 22 27 42 18 5-2 11 0 15 5-18 8-34 8-47 0-7-4-12-11-15-20 1-3 4-5 5-3Z"
      />
      <path
        fill="#0b1320"
        d="M19 73c23 13 65 20 128 16 4 0 7 2 8 6H63c-10 0-18-2-25-7L18 73h1Z"
      />
      <path
        fill="#0b1320"
        d="M48 55c-10 1-20 3-30 5 8-8 16-17 23-29l26 18c-5 3-11 5-19 6Z"
        opacity=".28"
      />
      <path
        fill="none"
        stroke="#0b1320"
        strokeLinecap="round"
        strokeWidth="4"
        d="m72 58 34-13m-24 20 31-10m-17 18 26-8"
      />
      <path
        fill="none"
        stroke="#f13a1f"
        strokeLinecap="round"
        strokeWidth="6"
        d="M5 57h30M1 73h25M22 41h28"
      />
      <path
        fill="none"
        stroke="#ff7656"
        strokeLinecap="round"
        strokeWidth="4"
        d="M88 78c17 6 35 8 53 6"
      />
    </svg>
  );
}

export function Logo({ size = 'md', full = false }: { size?: 'sm' | 'md' | 'lg'; full?: boolean }) {
  const heights: Record<string, string> = { sm: 'h-6', md: 'h-8', lg: 'h-10' };
  const textSizes: Record<string, string> = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <Link href="/" aria-label="Fund an Athlete's Dream home" className="flex items-center gap-2.5 select-none">
      <ShoeMark className={`${heights[size]} w-auto shrink-0 overflow-visible`} />
      <span className={`font-display font-bold leading-none text-ink ${textSizes[size]}`}>
        {full ? "Fund an Athlete's Dream" : 'FAD'}
      </span>
    </Link>
  );
}
