// Public API contract: `percent` is clamped to 0–100. Size/track overrides are
// separate props (not one className) so Tailwind utilities never conflict.
export function ProgressBar({
  percent,
  tone = 'gradient',
  heightClassName = 'h-2.5',
  widthClassName = 'w-full',
  trackColorClassName = 'bg-surface-container',
  className = '',
}: {
  percent: number;
  tone?: 'gradient' | 'primary';
  heightClassName?: string;
  widthClassName?: string;
  trackColorClassName?: string;
  className?: string;
}) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const fillToneClass = tone === 'primary' ? 'bg-primary' : 'progress-gradient';

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clampedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`overflow-hidden rounded-pill ${heightClassName} ${widthClassName} ${trackColorClassName} ${className}`}
    >
      <div
        className={`h-full rounded-pill transition-all ${fillToneClass}`}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
}
