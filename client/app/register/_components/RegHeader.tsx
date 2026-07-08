import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

const REG_STEPS = [
  { href: '/register/personal-basics', label: 'Step 1 — Basics' },
  { href: '/register/athletics', label: 'Step 2 — Results' },
  { href: '/register/values-social', label: 'Step 3 — Values' },
  { href: '/register/review', label: 'Step 4 — Review' },
];

// Minimal transactional header used across the registration flow (Arc brand +
// step progress). Distinct from the marketing SiteHeader, which is suppressed
// on /register routes.
export function RegHeader({
  stepLabel,
  progressPercent,
  currentStep,
  backHref,
  showHelp = false,
  sticky = true,
}: {
  stepLabel?: string;
  progressPercent?: number;
  currentStep?: number;
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
            <span className="hidden items-center gap-1 text-xs text-on-surface-variant sm:inline-flex">
              <Icon name="check" className="h-3.5 w-3.5 text-success" />
              Autosaves
            </span>
            <span className="eyebrow text-on-surface-variant">{stepLabel}</span>
            {typeof currentStep === 'number' ? (
              <nav aria-label="Registration steps" className="flex items-center gap-1.5">
                {REG_STEPS.map((step, index) => {
                  const stepNumber = index + 1;
                  const isCurrent = stepNumber === currentStep;
                  return (
                    <Link
                      key={step.href}
                      href={step.href}
                      aria-label={step.label}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`rounded-pill transition-all ${
                        isCurrent
                          ? 'h-2.5 w-6 bg-primary'
                          : stepNumber < currentStep
                            ? 'h-2.5 w-2.5 bg-primary/50 hover:bg-primary'
                            : 'h-2.5 w-2.5 bg-surface-container-highest hover:bg-surface-dim'
                      }`}
                    />
                  );
                })}
              </nav>
            ) : typeof progressPercent === 'number' ? (
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
