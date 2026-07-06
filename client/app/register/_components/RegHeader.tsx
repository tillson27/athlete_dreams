import Link from 'next/link';
import { Icon } from './Icon';

// Minimal transactional header used across the registration flow (Arc brand +
// step progress). Distinct from the marketing SiteHeader, which is suppressed
// on /register routes.
export function RegHeader({
  stepLabel,
  progressPercent,
  backHref,
  showHelp = false,
  sticky = true,
}: {
  stepLabel?: string;
  progressPercent?: number;
  backHref?: string;
  showHelp?: boolean;
  sticky?: boolean;
}) {
  return (
    <header
      className={`${sticky ? 'sticky top-0' : ''} z-50 w-full border-b border-outline-variant bg-surface`}
    >
      <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] items-center justify-between px-5 py-4 md:px-16">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="text-primary transition-transform active:scale-95"
            >
              <Icon name="arrow-back" className="h-6 w-6" />
            </Link>
          ) : null}
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            Arc
          </span>
        </div>

        {showHelp ? (
          <button
            type="button"
            aria-label="Help"
            className="text-primary transition-transform active:scale-95"
          >
            <Icon name="help" className="h-6 w-6" />
          </button>
        ) : stepLabel ? (
          <div className="flex items-center gap-4 md:gap-6">
            <span className="label-bold text-on-surface-variant">{stepLabel}</span>
            {typeof progressPercent === 'number' ? (
              <div className="h-2 w-24 overflow-hidden rounded-pill bg-surface-container md:w-32">
                <div
                  className="progress-gradient h-full rounded-pill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
