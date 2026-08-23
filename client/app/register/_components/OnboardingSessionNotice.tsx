'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { authHref } from '@/lib/authRedirect';
import { useOnboarding } from './OnboardingContext';

// Api-mode-only: when the session expires mid-wizard (a 401 clears it via the
// api layer's unauthorized listener), this prompts the athlete to sign in again
// while their in-progress answers stay held in memory by the context — so
// signing back in and returning resumes exactly where they left off. Renders
// nothing in mock mode or while signed in, so the wizard DOM is unchanged.
export function OnboardingSessionNotice() {
  const { mode, signedOut } = useOnboarding();
  const pathname = usePathname();
  if (mode !== 'api' || !signedOut) return null;

  return (
    <div className="border-b border-error/30 bg-error/10">
      <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-col items-start gap-2 px-5 py-3 md:flex-row md:items-center md:justify-between md:px-16">
        <p className="label-bold flex items-center gap-2 text-error">
          <Icon name="info" className="h-5 w-5 shrink-0" />
          You&rsquo;ve been signed out. Sign in again to keep building. Your answers are still here.
        </p>
        <Link
          href={authHref('/sign-in', pathname)}
          className="label-bold shrink-0 rounded-lg bg-primary px-5 py-2.5 text-on-primary transition-all hover:bg-primary-strong active:scale-95"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
