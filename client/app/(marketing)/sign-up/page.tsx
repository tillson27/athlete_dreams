import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { SignUpForm } from './SignUpForm';

export const metadata: Metadata = {
  title: 'Start a profile',
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-10 sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Tell your story.
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Three quick questions to start. Then you build your profile in about 10 minutes: your story,
          your results, and the values you run by.
        </p>
        <Suspense>
          <SignUpForm />
        </Suspense>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-on-surface-variant">
          <span>Already have an account?</span>
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
          <span>.</span>
        </p>
      </div>
    </div>
  );
}
