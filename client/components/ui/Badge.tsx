import type { ReactNode } from 'react';

type Tone = 'ink' | 'flame' | 'moss' | 'sky' | 'soft';

// Every soft-tint pairing uses `text-ink` so foreground/background contrast
// always exceeds 7:1, regardless of which accent the badge takes.
const toneClasses: Record<Tone, string> = {
  ink: 'bg-ink text-paper',
  flame: 'bg-flame-soft text-ink',
  moss: 'bg-moss-soft text-ink',
  sky: 'bg-sky-soft text-ink',
  soft: 'bg-ink/8 text-ink',
};

export function Badge({
  children,
  tone = 'soft',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
