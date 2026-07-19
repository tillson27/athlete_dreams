import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailPanel } from './VerifyEmailPanel';

export const metadata: Metadata = {
  title: 'Verify email',
};

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-10 sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Verified emails can publish athlete profiles and keep account recovery secure.
        </p>
        <Suspense fallback={<div className="mt-8 h-24 rounded-input bg-surface-container" />}>
          <VerifyEmailPanel />
        </Suspense>
      </div>
    </div>
  );
}
