'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { authHref } from '@/lib/authRedirect';
import { useOnboarding } from './OnboardingContext';

export function OnboardingStepGate({
  requiresDraft = false,
  children,
}: {
  requiresDraft?: boolean;
  children: React.ReactNode;
}) {
  const { mode, hydrating, signedOut, canEdit, hasDraft } = useOnboarding();
  const pathname = usePathname();

  if (mode === 'mock') return <>{children}</>;

  if (hydrating) {
    return <GatePanel icon="sync" title="Loading your profile" body="Fetching your saved draft." spinning />;
  }

  if (signedOut || !canEdit) {
    return (
      <GatePanel
        icon="lock"
        title="Sign in to build your profile"
        body="Create an account or sign in, then you can keep going from this step."
        action={
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={authHref('/sign-up', pathname)}
              className="label-bold inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 text-on-primary"
            >
              Create account
            </Link>
            <Link
              href={authHref('/sign-in', pathname)}
              className="label-bold inline-flex min-h-11 items-center justify-center rounded-button border border-outline px-5 text-on-surface"
            >
              Sign in
            </Link>
          </div>
        }
      />
    );
  }

  if (requiresDraft && !hasDraft) {
    return (
      <GatePanel
        icon="person"
        title="Start with the basics"
        body="Create your profile shell before adding results or publishing."
        action={
          <Link
            href="/register/personal-basics"
            className="label-bold mt-6 inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 text-on-primary"
          >
            Go to Step 1
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}

function GatePanel({
  icon,
  title,
  body,
  spinning = false,
  action,
}: {
  icon: 'lock' | 'person' | 'sync';
  title: string;
  body: string;
  spinning?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[55vh] w-full max-w-md flex-col justify-center text-center">
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <Icon
          name={icon}
          className={`mx-auto h-8 w-8 text-primary ${spinning ? 'animate-spin' : ''}`}
        />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">{title}</h1>
        <p className="mt-3 text-on-surface-variant">{body}</p>
        {action}
      </div>
    </section>
  );
}
