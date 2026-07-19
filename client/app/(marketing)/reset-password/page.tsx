import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordPanel } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Set new password',
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-10 sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Choose a stronger password for your ARC account.
        </p>
        <Suspense
          fallback={<p className="mt-8 text-sm text-on-surface-variant">Loading reset link...</p>}
        >
          <ResetPasswordPanel />
        </Suspense>
      </div>
    </div>
  );
}
