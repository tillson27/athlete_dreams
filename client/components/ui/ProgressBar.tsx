import { formatCents, formatProgress } from '@/lib/format';

type Variant = 'default' | 'compact' | 'over-photo';

// Champion Flow progress bar — light track + Olympic Blue → Champion Orange fill,
// pill-shaped to evoke a path/track.
export function ProgressBar({
  raisedAmountCents,
  targetAmountCents,
  supporterCount,
  variant = 'default',
  daysLeft,
}: {
  raisedAmountCents: number;
  targetAmountCents: number;
  supporterCount?: number;
  daysLeft?: number;
  variant?: Variant;
}) {
  const percent = formatProgress(raisedAmountCents, targetAmountCents);

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="label-bold text-on-surface-variant">Funding Goal</span>
          <span className="label-bold text-primary">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-surface-container">
          <div
            className="progress-gradient h-full rounded-pill transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'over-photo') {
    return (
      <div className="glass-effect-dark space-y-2 rounded-pill px-4 py-3 text-white">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-display text-lg font-bold">
            {formatCents(raisedAmountCents)}
          </span>
          <span className="label-bold text-white/85">{percent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/20">
          <div
            className="progress-gradient h-full rounded-pill transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl font-bold text-on-surface">
          {formatCents(raisedAmountCents)}
        </span>
        <span className="text-sm text-on-surface-variant">
          raised of {formatCents(targetAmountCents)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-pill bg-surface-container">
        <div
          className="progress-gradient h-full rounded-pill transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="label-bold text-primary">{percent}% funded</span>
        <div className="flex items-center gap-4 text-on-surface-variant">
          {typeof supporterCount === 'number' ? (
            <span>
              {supporterCount} supporter{supporterCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {typeof daysLeft === 'number' && daysLeft >= 0 ? (
            <span>{daysLeft} days left</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
