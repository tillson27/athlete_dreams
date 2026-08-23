// Marks a surface that is built but not finished. Deliberately the quietest
// element in its row — no pill, no border, no fill — because the feature it
// labels still works and must not read as disabled.
// Public API contract: `tone` picks the colour rather than a `className`
// override, because two text-colour utilities in one class string resolve by
// stylesheet order, not by argument order.
const toneClasses = {
  muted: 'text-tertiary',
  'on-image': 'text-white/70',
} as const;

export function ComingSoonLabel({
  tone = 'muted',
  className,
}: {
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wide ${toneClasses[tone]} ${className ?? ''}`}
    >
      Coming soon
    </span>
  );
}
