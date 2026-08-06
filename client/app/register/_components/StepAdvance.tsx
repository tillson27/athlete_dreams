'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnboarding, type OnboardingSaveStep } from './OnboardingContext';

// The wizard's per-step "Next" control. In mock mode it is the plain `<Link>`
// the prototype has always rendered (byte-identical markup, no persistence). In
// api mode it becomes a same-styled button that saves the step to the API on
// advance, blocks navigation on failure, and renders one curated error sentence
// inline (client/AGENTS.md minimalism). The mock/api branch lives here — the
// step pages just describe where "Next" goes.
export function StepAdvance({
  step,
  href,
  className,
  children,
}: {
  step: OnboardingSaveStep;
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const { mode, hydrating, canEdit, saving, saveError, saveAndAdvance, clearSaveError } =
    useOnboarding();
  const router = useRouter();

  if (mode === 'mock') {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  const advance = async () => {
    const saved = await saveAndAdvance(step);
    if (saved) router.push(href);
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto">
      <button
        type="button"
        onClick={advance}
        disabled={saving || hydrating || !canEdit}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-80`}
      >
        {saving ? 'Saving…' : children}
      </button>
      {saveError ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {saveError}{' '}
          <button type="button" onClick={clearSaveError} className="underline">
            Dismiss
          </button>
        </p>
      ) : null}
    </div>
  );
}
