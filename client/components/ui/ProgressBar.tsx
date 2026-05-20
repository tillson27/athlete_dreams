import { formatCents, formatProgress } from '@/lib/format';

export function ProgressBar({
  raisedAmountCents,
  targetAmountCents,
  supporterCount,
}: {
  raisedAmountCents: number;
  targetAmountCents: number;
  supporterCount?: number;
}) {
  const percent = formatProgress(raisedAmountCents, targetAmountCents);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-display text-2xl text-ink">
          {formatCents(raisedAmountCents)}
        </span>
        <span className="text-ink/60">
          raised of {formatCents(targetAmountCents)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-flame transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-ink/60">
        <span>{percent}% funded</span>
        {typeof supporterCount === 'number' ? (
          <span>{supporterCount} supporter{supporterCount === 1 ? '' : 's'}</span>
        ) : null}
      </div>
    </div>
  );
}
