'use client';

import { useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { useOnboarding } from './OnboardingContext';

export function StartOverButton({ className }: { className?: string }) {
  const { reset } = useOnboarding();
  const router = useRouter();

  const startOver = () => {
    const confirmed = window.confirm(
      'Start over? This clears everything you’ve entered and returns you to Step 1.',
    );
    if (!confirmed) return;
    reset();
    router.push('/register/personal-basics');
  };

  return (
    <button
      type="button"
      onClick={startOver}
      className={
        className ??
        'label-bold inline-flex items-center gap-1.5 text-on-surface-variant transition-colors hover:text-error'
      }
    >
      <Icon name="history" className="h-4 w-4" />
      Start over
    </button>
  );
}
