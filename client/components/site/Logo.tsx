import Link from 'next/link';

function BadgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#0b1320" strokeWidth="3" />
      <circle cx="67" cy="30" r="11" fill="#c83d1d" />
      <path
        fill="#0b1320"
        d="M15 78 L22 63 L31 50 L35 57 L41 53 L50 24 L60 46 L63 43 L68 38 L73 47 L78 58 L85 78 Z"
      />
      <path fill="white" d="M50 24 L58 42 L53 39 L57 46 L47 40 Z" />
      <path fill="white" d="M31 50 L36 58 L33 56 L36 61 L28 57 Z" />
      <path fill="white" d="M68 38 L74 50 L70 48 L73 53 L64 48 Z" />
      <path fill="none" stroke="#0b1320" strokeWidth="2.5" strokeLinecap="round" d="M14 73 Q50 71 86 73" />
      <path fill="none" stroke="#0b1320" strokeWidth="2.5" strokeLinecap="round" d="M18 45 Q22 41 26 45" />
      <path fill="none" stroke="#0b1320" strokeWidth="2" strokeLinecap="round" d="M22 51 Q26 47 30 51" />
    </svg>
  );
}

export function Logo({ size = 'md', full = false }: { size?: 'sm' | 'md' | 'lg'; full?: boolean }) {
  const heights: Record<string, string> = { sm: 'h-6', md: 'h-8', lg: 'h-10' };
  const textSizes: Record<string, string> = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

  return (
    <Link href="/" aria-label="Fund an Athlete's Dream — home" className="flex items-center gap-2.5 select-none">
      <BadgeMark className={`${heights[size]} w-auto`} />
      <span className={`font-display font-semibold tracking-tight text-ink ${textSizes[size]}`}>
        {full ? "Fund an Athlete's Dream" : 'FAD'}
      </span>
    </Link>
  );
}
